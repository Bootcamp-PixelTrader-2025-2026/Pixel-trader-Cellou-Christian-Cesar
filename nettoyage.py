import pandas as pd

df = pd.read_csv('stock_legacy_full.csv', sep=';')

# Uniformisation des noms
mapping_consoles = {
    # Sony
    'PS1': 'PlayStation 1',
    'Ps1': 'PlayStation 1',
    'PSX': 'PlayStation 1',
    'Playstation 1': 'PlayStation 1',
    'PlayStation': 'PlayStation 1',
    'PS2': 'PlayStation 2',
    'PS3': 'PlayStation 3',
    
    # Nintendo
    'N64': 'Nintendo 64',
    'SNES': 'Super Nintendo',
    'Super Nintendo': 'Super Nintendo',
    'GCN': 'Nintendo GameCube',
    'GC': 'Nintendo GameCube',
    'GameCube': 'Nintendo GameCube',
    'GameBoy': 'Game Boy',
    'GBA': 'Game Boy Advance',
    'Switch': 'Nintendo Switch',
    'NES': 'Nintendo Entertainment System (NES)',
    
    # Sega
    'Master System': 'Sega Master System',
    'Sega Mega Drive': 'Sega Mega Drive',
    'Dreamcast': 'Sega Dreamcast',
    
    # Autres
    'PC': 'PC (Windows)'
}

# Application de l'uniformisation
df['plateforme'] = df['plateforme'].replace(mapping_consoles)

# Ajout des dates
df.loc[df['titre_jeu'].str.contains('Zelda: A Link to the Past', na=False), 'annee_sortie'] = 1991
df.loc[df['titre_jeu'] == 'Tetris', 'annee_sortie'] = 1989
df.loc[df['titre_jeu'] == 'Half-Life', 'annee_sortie'] = 1998
df.loc[df['titre_jeu'] == 'Earthworm Jim', 'annee_sortie'] = 1994

# Convertion en euro
df['annee_sortie'] = pd.to_numeric(df['annee_sortie'], errors='coerce').astype('Int64')

def clean_price(val):
    if pd.isna(val) or str(val).lower() == 'null': return "0 €"
    s = str(val).upper()
    chiffres = "".join(filter(str.isdigit, s))
    if not chiffres: return "0 €"
    num = int(chiffres)
    if '¥' in s or 'YEN' in s: num = int(num * 0.0065)
    elif '$' in s: num = int(num * 0.95)
    return f"{num} €"

df['valeur_estimee'] = df['valeur_estimee'].apply(clean_price)
df['prix_achat'] = df['prix_achat'].apply(clean_price)

df.to_csv('stock_propre.csv', index=False, sep=';', encoding='utf-8-sig')
print("✅ Fichier exporté avec encodage spécial pour Excel et Workbench !")