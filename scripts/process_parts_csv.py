#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour traiter le fichier CSV et extraire les pièces uniques
pour import dans la base de données ECM
"""

import pandas as pd
import json
import os
from collections import defaultdict

def get_valid_designations():
    """Retourne la liste des désignations valides de l'ENUM"""
    return [
        'Other', 'Gear', 'Hub', 'Clip', 'Tool', 'Misc', 
        'Housing', 'Ring', 'Shaft', 'Sample', 'Bushing', 'Piston'
    ]

def normalize_designation(designation_str, valid_designations):
    """
    Normalise la désignation et vérifie si elle existe dans l'ENUM
    Retourne 'Other' si la désignation n'est pas trouvée
    """
    if pd.isna(designation_str) or designation_str.strip() == '':
        return 'Other'
    
    # Conversion en string et nettoyage
    normalized = str(designation_str).strip()
    
    # Vérifier si la désignation est directement dans la liste
    if normalized in valid_designations:
        return normalized
    
    # Recherche insensible à la casse
    for valid_designation in valid_designations:
        if normalized.lower() == valid_designation.lower():
            return valid_designation
    
    # Si aucune correspondance n'est trouvée
    print(f"Désignation non trouvée dans l'ENUM: '{designation_str}' -> utilisation de 'Other'")
    return 'Other'

def normalize_steel(steel_str):
    """Normalise le nom de l'acier"""
    if pd.isna(steel_str) or steel_str.strip() == '' or steel_str.strip() == '-':
        return None
    return str(steel_str).strip()

def normalize_client_designation(client_designation_str):
    """Normalise la désignation client"""
    if pd.isna(client_designation_str) or client_designation_str.strip() == '':
        return None
    return str(client_designation_str).strip()

def normalize_specifications(spec_str):
    """Normalise les spécifications"""
    if pd.isna(spec_str) or spec_str.strip() == '':
        return {}
    
    try:
        # Tenter de parser le JSON
        spec_dict = json.loads(spec_str)
        return spec_dict
    except (json.JSONDecodeError, TypeError):
        print(f"Erreur lors du parsing des spécifications: {spec_str[:100]}...")
        return {}

def create_part_key(client, designation_uni, designation, specifications):
    """Crée une clé unique pour identifier une pièce"""
    # Convertir les spécifications en string pour la clé
    spec_key = json.dumps(specifications, sort_keys=True) if specifications else ""
    return f"{client}|{designation_uni}|{designation}|{spec_key}"

def process_csv_file(input_file, output_file):
    """
    Traite le fichier CSV et extrait les pièces uniques
    """
    print(f"Lecture du fichier: {input_file}")
    
    # Lecture du fichier CSV
    df = pd.read_csv(input_file, encoding='utf-8')
    
    print(f"Nombre total de lignes: {len(df)}")
    print(f"Colonnes disponibles: {list(df.columns)}")
    
    # Vérifier que les colonnes nécessaires existent
    required_columns = ['client', 'designation_uni', 'designation', 'specifications', 'steel']
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        raise ValueError(f"Colonnes manquantes: {missing_columns}")
    
    # Extraire les colonnes nécessaires
    parts_df = df[required_columns].copy()
    
    # Obtenir la liste des désignations valides
    valid_designations = get_valid_designations()
    
    # Dictionnaire pour stocker les pièces uniques par client
    parts_by_client = defaultdict(list)
    part_keys_seen = set()
    
    print(f"Traitement des {len(parts_df)} lignes...")
    
    for index, row in parts_df.iterrows():
        try:
            client_name = str(row['client']).strip()
            
            # Normaliser les données
            designation_uni = normalize_designation(row['designation_uni'], valid_designations)
            client_designation = normalize_client_designation(row['designation'])
            steel = normalize_steel(row['steel'])
            specifications = normalize_specifications(row['specifications'])
            
            # Créer une clé unique pour cette pièce
            part_key = create_part_key(client_name, designation_uni, client_designation, specifications)
            
            # Vérifier si cette pièce n'a pas déjà été traitée
            if part_key not in part_keys_seen:
                part_keys_seen.add(part_key)
                
                # Créer la pièce
                part = {
                    'client': client_name,
                    'designation': designation_uni,  # designation_uni -> designation dans la BD
                    'client_designation': client_designation,  # designation -> client_designation dans la BD
                    'steel': steel,
                    'specifications': specifications,
                    'dimensions': {},  # Pas de dimensions dans le CSV
                    'reference': None,  # Pas de référence dans le CSV
                    'quantity': None   # Pas de quantité dans le CSV
                }
                
                parts_by_client[client_name].append(part)
                
                if index % 100 == 0:
                    print(f"Traité {index} lignes...")
                    
        except Exception as e:
            print(f"Erreur lors du traitement de la ligne {index}: {e}")
            continue
    
    # Convertir en liste pour la sérialisation JSON
    all_parts = []
    for client_name, parts in parts_by_client.items():
        all_parts.extend(parts)
    
    # Sauvegarder les données traitées en JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_parts, f, indent=2, ensure_ascii=False)
    
    print(f"\nDonnées sauvegardées dans: {output_file}")
    print(f"Nombre total de pièces uniques: {len(all_parts)}")
    
    # Afficher quelques statistiques
    print("\nStatistiques par client:")
    for client_name, parts in sorted(parts_by_client.items()):
        print(f"  {client_name}: {len(parts)} pièces")
    
    # Statistiques par désignation
    designation_stats = defaultdict(int)
    steel_stats = defaultdict(int)
    
    for part in all_parts:
        designation_stats[part['designation']] += 1
        if part['steel']:
            steel_stats[part['steel']] += 1
    
    print(f"\nRépartition par désignation:")
    for designation, count in sorted(designation_stats.items(), key=lambda x: x[1], reverse=True):
        print(f"  {designation}: {count} pièces")
    
    print(f"\nTop 10 des aciers:")
    for steel, count in sorted(steel_stats.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {steel}: {count} pièces")
    
    return all_parts

def main():
    """Fonction principale"""
    # Chemins des fichiers
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(os.path.dirname(script_dir), 'toBase.txt')
    output_file = os.path.join(script_dir, 'parts_to_import.json')
    
    try:
        # Vérifier que le fichier d'entrée existe
        if not os.path.exists(input_file):
            raise FileNotFoundError(f"Fichier non trouvé: {input_file}")
        
        # Traiter le fichier
        processed_parts = process_csv_file(input_file, output_file)
        
        print(f"\n✅ Traitement terminé avec succès!")
        print(f"📄 Fichier de sortie: {output_file}")
        print(f"🔧 Nombre de pièces à importer: {len(processed_parts)}")
        
    except Exception as e:
        print(f"❌ Erreur lors du traitement: {str(e)}")
        raise

if __name__ == "__main__":
    main()
