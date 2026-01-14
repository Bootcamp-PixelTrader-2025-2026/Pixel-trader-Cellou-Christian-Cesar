const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const INPUT_STOCK = 'stock_legacy_full.csv';
const INPUT_DATES = 'dates_sortie_manuel.csv';
const OUTPUT = 'stock_nettoye.csv';

const TAUX_CONVERSION = {
  EUR: 1,
  USD: 0.93,
  JPY: 0.0062,
  GBP: 1.17
};

const ETATS_VALIDES = {
  excellent: 'Excellent',
  bon: 'Bon',
  moyen: 'Moyen',
  mauvais: 'Mauvais'
};

const datesManuelles = {};

// ---------- Helpers ----------

function nettoyerEtat(etat) {
  if (!etat) return 'Moyen';
  const k = etat.toString().toLowerCase().trim();
  return ETATS_VALIDES[k] || 'Moyen';
}

function detectDevise(str) {
  if (!str) return 'EUR';
  const s = str.toString().toUpperCase();
  if (s.includes('¥') || s.includes('YEN') || s.includes('JPY')) return 'JPY';
  if (s.includes('$') || s.includes('USD')) return 'USD';
  if (s.includes('GBP') || s.includes('£')) return 'GBP';
  if (s.includes('€') || s.includes('EUR') || s.includes('EURO')) return 'EUR';
  return 'EUR'; // pas de symbole → on suppose EUR
}

function extractNumber(str) {
  if (str === undefined || str === null) return null;
  const s = str.toString().trim();
  if (s === '' || s.toUpperCase() === 'NULL') return null;

  const cleaned = s
    .replace(/\s/g, '')
    .replace(/[^0-9,.\-]/g, '')
    .replace(',', '.');

  if (!cleaned) return null;

  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Retourne un nombre "xx.xx" (string) en EUR
function convertirEnEurosNumber(strMontant) {
  const montant = extractNumber(strMontant);
  if (montant === null) return null;

  const devise = detectDevise(strMontant);
  const taux = TAUX_CONVERSION[devise];

  if (!taux) {
    console.warn(`⚠️ Devise non gérée "${devise}" pour "${strMontant}" → EUR par défaut`);
    return montant.toFixed(2);
  }

  return (montant * taux).toFixed(2);
}

// Retourne "xx.xx €"
function formatEuro(eurNumberStr) {
  if (eurNumberStr === null || eurNumberStr === undefined || eurNumberStr === '') return '';
  return `${eurNumberStr} €`;
}

// ---------- Chargement dates ----------

function chargerDatesManuelles() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(INPUT_DATES)) {
      console.warn(`⚠️ ${INPUT_DATES} introuvable → aucune année ne sera complétée`);
      return resolve();
    }

    fs.createReadStream(INPUT_DATES)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        if (row.titre_jeu && row.annee_sortie) {
          datesManuelles[row.titre_jeu] = row.annee_sortie;
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });
}

// ---------- Main ----------

async function run() {
  await chargerDatesManuelles();

  const lignes = [];
  let headers = null;

  await new Promise((resolve, reject) => {
    fs.createReadStream(INPUT_STOCK)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        if (!headers) {
          headers = Object.keys(row);
          if (!headers.includes('prix_eur')) headers.push('prix_eur');
        }

        // --- Année ---
        let annee = row.annee_sortie;
        if (!annee || annee.toString().trim() === '' || annee.toString().toUpperCase() === 'NULL') {
          annee = datesManuelles[row.titre_jeu] || '';
        }

        // --- Etat ---
        const etat = nettoyerEtat(row.etat);

        // --- Convertir valeur_estimee et prix_achat en euros (remplacement) ---
        const valeurEurNum = convertirEnEurosNumber(row.valeur_estimee);
        const achatEurNum = convertirEnEurosNumber(row.prix_achat);

        // Remplacer les champs originaux par une version euro lisible
        const valeur_estimee_eur = valeurEurNum ? formatEuro(valeurEurNum) : '';
        const prix_achat_eur = achatEurNum ? formatEuro(achatEurNum) : '';

        // --- Prix de référence: estimé si dispo sinon achat ---
        const prixRefNum = valeurEurNum !== null ? valeurEurNum : achatEurNum;

        lignes.push({
          ...row,
          annee_sortie: annee,
          etat: etat,
          valeur_estimee: valeur_estimee_eur,
          prix_achat: prix_achat_eur,
          prix_eur: prixRefNum ?? ''
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  if (!headers) throw new Error(`Aucune donnée lue dans ${INPUT_STOCK}`);

  const writer = createObjectCsvWriter({
    path: OUTPUT,
    fieldDelimiter: ';',
    header: headers.map(h => ({ id: h, title: h }))
  });

  await writer.writeRecords(lignes);
  console.log('✅ CSV nettoyé: valeur_estimee & prix_achat convertis en € + prix_eur recalculé');
}

run().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
