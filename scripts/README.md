# Scripts d'Import des Clients ECM

Ce dossier contient les scripts pour importer les clients depuis le fichier CSV `toBase.txt` vers la base de données ECM.

## 📋 Prérequis

- **Python 3.x** avec pandas installé (`pip install pandas`)
- **Node.js** avec les dépendances du projet installées
- Base de données ECM configurée et accessible
- Fichier `toBase.txt` dans le répertoire parent de ce dossier

## 📁 Fichiers

- `process_clients_csv.py` - Script Python pour traiter le CSV et extraire les clients uniques
- `import_clients.js` - Script Node.js pour importer les clients dans la base de données
- `run_import.bat` - Script Windows pour automatiser tout le processus
- `run_import.sh` - Script Unix/Linux pour automatiser tout le processus
- `README.md` - Ce fichier de documentation

## 🚀 Utilisation

### Option 1: Script automatique (Recommandé)

**Sur Windows:**
```bash
run_import.bat
```

**Sur Linux/Mac:**
```bash
chmod +x run_import.sh
./run_import.sh
```

### Option 2: Exécution manuelle

1. **Traitement du CSV:**
   ```bash
   python process_clients_csv.py
   ```

2. **Import des clients:**
   ```bash
   node import_clients.js
   ```

## 📊 Processus détaillé

### Étape 1: Traitement du CSV (`process_clients_csv.py`)

Le script Python:
- Lit le fichier `toBase.txt` (format TSV)
- Extrait les colonnes: `client`, `country`, `city`
- Supprime les doublons basés sur le nom du client
- Normalise les noms de pays selon l'ENUM de la base de données
- Convertit les pays non reconnus en "OTHER"
- Génère un fichier JSON `clients_to_import.json`

**Normalisation des pays:**
- Conversion automatique en majuscules
- Mappings pour les variantes courantes (US → USA, UK → UNITED_KINGDOM, etc.)
- Validation contre la liste ENUM de la base de données
- Fallback vers "OTHER" pour les pays non reconnus

### Étape 2: Import des clients (`import_clients.js`)

Le script Node.js:
- Lit le fichier `clients_to_import.json`
- Utilise la fonction existante `createClient` du `clientService`
- Crée les entrées dans les tables `nodes`, `clients`, et `closure`
- Met le `data_status` à "old" comme demandé
- Gère les doublons (ignore les clients déjà existants)
- Affiche des statistiques détaillées

**Données créées:**

**Table `nodes`:**
- `id` - Auto-incrémenté
- `name` - Nom du client
- `path` - `/${nom_client}`
- `type` - "client"
- `parent_id` - NULL (racine)
- `created_at` - Date/heure actuelle
- `modified_at` - Date/heure actuelle
- `data_status` - "old"
- `description` - NULL

**Table `clients`:**
- `node_id` - Référence vers `nodes.id`
- `client_code` - Généré automatiquement (`CLI_${node_id}`)
- `country` - Pays normalisé
- `city` - Ville (peut être NULL)
- `client_group` - NULL
- `address` - NULL

**Table `closure`:**
- `ancestor_id` - `node_id`
- `descendant_id` - `node_id` (auto-relation)
- `depth` - 0

## 📈 Statistiques attendues

D'après l'analyse du fichier CSV:
- **Total de lignes:** 898
- **Clients uniques:** 123
- **Pays représentés:** Divers (avec normalisation automatique)

## ⚠️ Gestion des erreurs

- **Clients déjà existants:** Ignorés silencieusement
- **Pays non reconnus:** Convertis en "OTHER"
- **Villes manquantes:** Définies comme NULL
- **Erreurs de base de données:** Affichées avec détails

## 🔍 Validation

Après l'import, vous pouvez vérifier les résultats avec ces requêtes SQL:

```sql
-- Nombre de clients créés
SELECT COUNT(*) FROM nodes WHERE type = 'client';

-- Répartition par pays
SELECT country, COUNT(*) as count 
FROM clients c
JOIN nodes n ON c.node_id = n.id 
GROUP BY country 
ORDER BY count DESC;

-- Vérifier les entrées closure
SELECT COUNT(*) FROM closure WHERE depth = 0;
```

## 🛠️ Dépannage

### Erreur: "Module pandas not found"
```bash
pip install pandas
```

### Erreur: "Connexion à la base de données impossible"
- Vérifiez la configuration dans `server/config/database.js`
- Assurez-vous que la base de données est démarrée

### Erreur: "Fichier toBase.txt non trouvé"
- Vérifiez que le fichier est dans le répertoire parent
- Vérifiez les permissions de lecture

### Erreur: "Table clients n'existe pas"
- Exécutez les migrations de la base de données
- Vérifiez que toutes les tables sont créées

## 📝 Logs

Les scripts génèrent des logs détaillés incluant:
- Progression de l'import
- Clients créés avec succès
- Clients ignorés (doublons)
- Erreurs rencontrées
- Statistiques finales
- Répartition par pays

## 🔄 Réexécution

Les scripts peuvent être réexécutés sans problème:
- Les clients existants sont automatiquement détectés et ignorés
- Seuls les nouveaux clients sont créés
- Aucune donnée n'est écrasée ou dupliquée
