# Script ETL - Chargement des données

Ce script ETL permet de charger des données depuis un fichier CSV en utilisant les services existants de l'application pour créer la hiérarchie clients > commandes > pièces > tests.

## Structure des données

Le script traite un fichier CSV avec les colonnes suivantes :
- `id`, `file`, `load`, `date`, `recipe`, `client`, `country`, `city`
- `specifications`, `acier_canon`, `standard`, `designation`
- `client_designation`, `dimensions_json`, `results_data`, `recipe_data`
- `load_data`, `created_on`, `updated_on`

## Processus ETL

Le script suit ce processus en 4 étapes :

### 1. Création des clients
- Extrait tous les clients uniques de la colonne `client`
- Utilise les colonnes `country` et `city` pour enrichir les données
- Crée les clients via `clientService.createClient()`

### 2. Création des commandes (demandes d'essai)
- Crée une commande par client à la date d'aujourd'hui
- Les commandes sont des enfants directs des clients
- Utilise `orderService.createOrder()`

### 3. Création des pièces
- Extrait les pièces uniques basées sur `designation` + `client_designation` + `client`
- Utilise les colonnes `dimensions_json`, `specifications`, `acier_canon`/`standard`
- Les champs `reference` et `quantity` restent vides comme demandé
- Les pièces sont des enfants des commandes
- Utilise `partService.createPart()`

### 4. Création des tests
- Crée un test par ligne du CSV
- Mappe `load` → `load_number`, `created_on` → `test_date`
- Parse les données JSON : `load_data`, `recipe_data`, `results_data`
- Les tests sont des enfants des pièces
- Utilise `testService.createTest()`

## Installation

```bash
# Installer la nouvelle dépendance
cd server
npm install csv-parser
```

## Utilisation

### Méthode 1 : Avec votre fichier CSV
```bash
# Depuis le dossier server/
npm run etl:load chemin/vers/votre/fichier.csv

# Ou directement avec Node
node scripts/etl-load-data.js chemin/vers/votre/fichier.csv
```

### Méthode 2 : Test avec données d'exemple
```bash
# Depuis le dossier server/
npm run etl:test

# Ou directement avec Node
node scripts/etl-test.js
```

## Format du fichier CSV

Votre fichier CSV doit avoir les en-têtes suivants :
```csv
id,file,load,date,recipe,client,country,city,specifications,acier_canon,standard,designation,client_designation,dimensions_json,results_data,recipe_data,load_data,created_on,updated_on
```

### Exemple de ligne CSV :
```csv
TEST001,test-file-1.pdf,LOAD001,2024-01-15,Recipe A,ACME Corp,FRANCE,Paris,"{""hardness"": ""45-50 HRC""}",42CrMo4,EN 10083,Gear,Gear-Type-A,"{""diameter"": 50, ""length"": 100}","{""status"": ""OK""}","{""temperature"": 850}","{""furnace"": ""F001""}",2024-01-15,2024-01-15
```

## Gestion des erreurs

Le script :
- Continue le traitement même si certaines lignes échouent
- Affiche un résumé des erreurs à la fin
- Log les erreurs de parsing JSON sans arrêter le processus
- Vérifie l'existence des dépendances (clients, commandes, pièces)

## Logs et monitoring

Le script affiche :
- ✅ Succès pour chaque création réussie
- ❌ Erreurs avec détails
- 📊 Statistiques de traitement
- ⚠️ Avertissements pour les données malformées

## Points importants

1. **Ordre des créations** : Le script respecte l'ordre hiérarchique (clients → commandes → pièces → tests)

2. **Unicité** : 
   - Clients uniques par nom
   - Une commande par client
   - Pièces uniques par (designation + client_designation + client)
   - Un test par ligne CSV

3. **Données par défaut** :
   - Date des commandes : aujourd'hui
   - Status des tests : 'Pending'
   - Location des tests : 'ECM'
   - Pays par défaut : 'OTHER' si manquant

4. **Transactions** : Chaque service utilise ses propres transactions pour garantir la cohérence

## Troubleshooting

### Erreur "Client non trouvé"
- Vérifiez que la colonne `client` est bien renseignée
- Les noms de clients sont sensibles à la casse

### Erreur de parsing JSON
- Vérifiez le format des colonnes JSON (`dimensions_json`, `results_data`, etc.)
- Les guillemets doivent être échappés correctement dans le CSV

### Erreur "Pièce non trouvée"
- Vérifiez que les colonnes `designation` et `client` sont renseignées
- La combinaison designation + client_designation + client doit être unique

## Exemple complet

Pour tester rapidement :

```bash
cd server
npm run etl:test
```

Cela créera des données d'exemple et les chargera dans votre base de données.
