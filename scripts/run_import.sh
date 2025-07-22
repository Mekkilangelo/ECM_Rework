#!/bin/bash

# Script pour automatiser l'import des clients
# 1. Traite le CSV avec Python
# 2. Importe les clients avec Node.js

echo "🎯 SCRIPT D'IMPORT DES CLIENTS ECM"
echo "================================="
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "../toBase.txt" ]; then
    echo "❌ Erreur: Le fichier toBase.txt n'a pas été trouvé dans le répertoire parent"
    echo "   Assurez-vous d'être dans le répertoire scripts/ et que toBase.txt existe"
    exit 1
fi

# Étape 1: Traitement du CSV avec Python
echo "📊 Étape 1: Traitement du fichier CSV avec Python..."
echo "----------------------------------------------------"

if command -v python3 &> /dev/null; then
    python3 process_clients_csv.py
elif command -v python &> /dev/null; then
    python process_clients_csv.py
else
    echo "❌ Erreur: Python n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du traitement du CSV"
    exit 1
fi

echo ""
echo "✅ Traitement du CSV terminé"
echo ""

# Vérifier que le fichier JSON a été créé
if [ ! -f "clients_to_import.json" ]; then
    echo "❌ Erreur: Le fichier clients_to_import.json n'a pas été créé"
    exit 1
fi

# Étape 2: Import des clients avec Node.js
echo "🚀 Étape 2: Import des clients dans la base de données..."
echo "--------------------------------------------------------"

if command -v node &> /dev/null; then
    node import_clients.js
else
    echo "❌ Erreur: Node.js n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'import des clients"
    exit 1
fi

echo ""
echo "🎉 IMPORT TERMINÉ AVEC SUCCÈS!"
echo "=============================="
echo ""

# Nettoyage optionnel
read -p "Voulez-vous supprimer le fichier temporaire clients_to_import.json? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm clients_to_import.json
    echo "🗑️  Fichier temporaire supprimé"
else
    echo "📄 Fichier temporaire conservé: clients_to_import.json"
fi

echo ""
echo "✨ Processus d'import terminé!"
