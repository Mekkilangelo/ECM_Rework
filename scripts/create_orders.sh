#!/bin/bash

# Script pour créer automatiquement les demandes d'essai pour tous les clients

echo "🎯 SCRIPT DE CRÉATION DES DEMANDES D'ESSAI ECM"
echo "=============================================="
echo ""

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Erreur: Node.js n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

echo "🚀 Création des demandes d'essai pour tous les clients..."
echo "--------------------------------------------------------"

node create_orders.js
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la création des demandes d'essai"
    exit 1
fi

echo ""
echo "🎉 CRÉATION DES DEMANDES D'ESSAI TERMINÉE AVEC SUCCÈS!"
echo "======================================================"
echo ""
echo "✨ Processus terminé!"
