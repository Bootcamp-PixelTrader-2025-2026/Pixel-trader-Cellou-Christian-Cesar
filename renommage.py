import os

# Chemin vers les images
dossier = 'static'

for nom in os.listdir(dossier):
    # On nettoie le nom (virer les "_Logo" et mettre en minuscule)
    propre = nom.replace('_Logo', '').replace('_logo', '').lower()
    
    # Remplacer les espaces par des underscores
    propre = propre.replace(' ', '_')
    
    # Chemins complets
    ancien = os.path.join(dossier, nom)
    nouveau = os.path.join(dossier, propre)
    
    # On renomme le fichier
    os.rename(ancien, nouveau)

print("Terminé : images renommées.")