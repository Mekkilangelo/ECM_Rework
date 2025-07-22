#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour traiter le fichier CSV et extraire les clients uniques
pour import dans la base de données ECM
"""

import pandas as pd
import json
import os

def get_valid_countries():
    """Retourne la liste des pays valides de l'ENUM"""
    return [
        'USA','AFGHANISTAN','ALBANIA','ALGERIA','ANDORRA','ANGOLA','ANTIGUA_DEPS',
        'ARGENTINA','ARMENIA','AUSTRALIA','AUSTRIA','AZERBAIJAN','BAHAMAS','BAHRAIN',
        'BANGLADESH','BARBADOS','BELARUS','BELGIUM','BELIZE','BENIN','BHUTAN','BOLIVIA',
        'BOSNIA_HERZEGOVINA','BOTSWANA','BRAZIL','BRUNEI','BULGARIA','BURKINA','BURMA',
        'BURUNDI','CAMBODIA','CAMEROON','CANADA','CAPE_VERDE','CENTRAL_AFRICAN_REP',
        'CHAD','CHILE','CHINA','REPUBLIC_OF_CHINA','COLOMBIA','COMOROS',
        'DEMOCRATIC_REPUBLIC_OF_THE_CONGO','REPUBLIC_OF_THE_CONGO','COSTA_RICA',
        'CROATIA','CUBA','CYPRUS','CZECH_REPUBLIC','DANZIG','DENMARK','DJIBOUTI',
        'DOMINICA','DOMINICAN_REPUBLIC','EAST_TIMOR','ECUADOR','EGYPT','EL_SALVADOR',
        'EQUATORIAL_GUINEA','ERITREA','ESTONIA','ETHIOPIA','FIJI','FINLAND','FRANCE',
        'GABON','GAZA_STRIP','THE_GAMBIA','GEORGIA','GERMANY','GHANA','GREECE',
        'GRENADA','GUATEMALA','GUINEA','GUINEA_BISSAU','GUYANA','HAITI',
        'HOLY_ROMAN_EMPIRE','HONDURAS','HUNGARY','ICELAND','INDIA','INDONESIA','IRAN',
        'IRAQ','REPUBLIC_OF_IRELAND','ISRAEL','ITALY','IVORY_COAST','JAMAICA','JAPAN',
        'JONATHANLAND','JORDAN','KAZAKHSTAN','KENYA','KIRIBATI','NORTH_KOREA',
        'SOUTH_KOREA','KOSOVO','KUWAIT','KYRGYZSTAN','LAOS','LATVIA','LEBANON',
        'LESOTHO','LIBERIA','LIBYA','LIECHTENSTEIN','LITHUANIA','LUXEMBOURG',
        'MACEDONIA','MADAGASCAR','MALAWI','MALAYSIA','MALDIVES','MALI','MALTA',
        'MARSHALL_ISLANDS','MAURITANIA','MAURITIUS','MEXICO','MICRONESIA','MOLDOVA',
        'MONACO','MONGOLIA','MONTENEGRO','MOROCCO','MOUNT_ATHOS','MOZAMBIQUE',
        'NAMIBIA','NAURU','NEPAL','NEWFOUNDLAND','NETHERLANDS','NEW_ZEALAND',
        'NICARAGUA','NIGER','NIGERIA','NORWAY','OMAN','OTHER','OTTOMAN_EMPIRE',
        'PAKISTAN','PALAU','PALESTINE','PANAMA','PAPUA_NEW_GUINEA','PARAGUAY','PERU',
        'PHILIPPINES','POLAND','PORTUGAL','PRUSSIA','QATAR','ROMANIA','ROME',
        'RUSSIAN_FEDERATION','RWANDA','GRENADINES','SAMOA','SAN_MARINO',
        'SAO_TOME_PRINCIPE','SAUDI_ARABIA','SENEGAL','SERBIA','SEYCHELLES',
        'SIERRA_LEONE','SINGAPORE','SLOVAKIA','SLOVENIA','SOLOMON_ISLANDS','SOMALIA',
        'SOUTH_AFRICA','SPAIN','SRI_LANKA','SUDAN','SURINAME','SWAZILAND','SWEDEN',
        'SWITZERLAND','SYRIA','TAJIKISTAN','TANZANIA','THAILAND','TOGO','TONGA',
        'TRINIDAD_TOBAGO','TUNISIA','TURKEY','TURKMENISTAN','TUVALU','UGANDA',
        'UKRAINE','UNITED_ARAB_EMIRATES','UNITED_KINGDOM','URUGUAY','UZBEKISTAN',
        'VANUATU','VATICAN_CITY','VENEZUELA','VIETNAM','YEMEN','ZAMBIA','ZIMBABWE'
    ]

def normalize_country(country_str, valid_countries):
    """
    Normalise le nom du pays et vérifie s'il existe dans l'ENUM
    Retourne 'OTHER' si le pays n'est pas trouvé
    """
    if pd.isna(country_str) or country_str.strip() == '' or country_str.strip() == '.':
        return 'OTHER'
    
    # Conversion en majuscules et normalisation
    normalized = str(country_str).strip().upper()
    
    # Mappings spéciaux pour des cas courants
    country_mappings = {
        'UNITED STATES': 'USA',
        'US': 'USA',
        'UNITED STATES OF AMERICA': 'USA',
        'UK': 'UNITED_KINGDOM',
        'GREAT BRITAIN': 'UNITED_KINGDOM',
        'BRITAIN': 'UNITED_KINGDOM',
        'ENGLAND': 'UNITED_KINGDOM',
        'RUSSIA': 'RUSSIAN_FEDERATION',
        'SOUTH KOREA': 'SOUTH_KOREA',
        'NORTH KOREA': 'NORTH_KOREA',
        'CZECH REPUBLIC': 'CZECH_REPUBLIC',
        'REPUBLIC OF IRELAND': 'REPUBLIC_OF_IRELAND',
        'IRELAND': 'REPUBLIC_OF_IRELAND'
    }
    
    # Vérifier d'abord les mappings spéciaux
    if normalized in country_mappings:
        return country_mappings[normalized]
    
    # Vérifier si le pays est directement dans la liste
    if normalized in valid_countries:
        return normalized
    
    # Recherche partielle pour des noms composés
    for valid_country in valid_countries:
        if normalized in valid_country or valid_country in normalized:
            return valid_country
    
    # Si aucune correspondance n'est trouvée
    print(f"Pays non trouvé dans l'ENUM: '{country_str}' -> utilisation de 'OTHER'")
    return 'OTHER'

def normalize_city(city_str):
    """Normalise le nom de la ville"""
    if pd.isna(city_str) or city_str.strip() == '' or city_str.strip() == '.':
        return None
    return str(city_str).strip()

def process_csv_file(input_file, output_file):
    """
    Traite le fichier CSV et extrait les clients uniques
    """
    print(f"Lecture du fichier: {input_file}")
    
    # Lecture du fichier CSV avec le bon séparateur (tab)
    df = pd.read_csv(input_file, sep='\t', encoding='utf-8')
    
    print(f"Nombre total de lignes: {len(df)}")
    print(f"Colonnes disponibles: {list(df.columns)}")
    
    # Vérifier que les colonnes nécessaires existent
    required_columns = ['client', 'country', 'city']
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        raise ValueError(f"Colonnes manquantes: {missing_columns}")
    
    # Extraire les colonnes nécessaires
    clients_df = df[['client', 'country', 'city']].copy()
    
    # Supprimer les doublons basés sur le nom du client
    print(f"Nombre de lignes avant dédoublonnage: {len(clients_df)}")
    clients_unique = clients_df.drop_duplicates(subset=['client'])
    print(f"Nombre de clients uniques: {len(clients_unique)}")
    
    # Obtenir la liste des pays valides
    valid_countries = get_valid_countries()
    
    # Traiter les données
    processed_clients = []
    
    for index, row in clients_unique.iterrows():
        client_name = str(row['client']).strip()
        
        # Normaliser le pays
        country = normalize_country(row['country'], valid_countries)
        
        # Normaliser la ville
        city = normalize_city(row['city'])
        
        processed_client = {
            'name': client_name,
            'country': country,
            'city': city,
            'client_group': None,  # Reste vide comme demandé
            'address': None,       # Reste vide comme demandé
            'description': None    # Reste vide comme demandé
        }
        
        processed_clients.append(processed_client)
        
        print(f"Client traité: {client_name} - {country} - {city}")
    
    # Sauvegarder les données traitées en JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(processed_clients, f, indent=2, ensure_ascii=False)
    
    print(f"\nDonnées sauvegardées dans: {output_file}")
    print(f"Nombre de clients à créer: {len(processed_clients)}")
    
    # Afficher quelques statistiques
    countries_count = {}
    for client in processed_clients:
        country = client['country']
        countries_count[country] = countries_count.get(country, 0) + 1
    
    print("\nRépartition par pays:")
    for country, count in sorted(countries_count.items()):
        print(f"  {country}: {count} clients")
    
    return processed_clients

def main():
    """Fonction principale"""
    # Chemins des fichiers
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(os.path.dirname(script_dir), 'toBase.txt')
    output_file = os.path.join(script_dir, 'clients_to_import.json')
    
    try:
        # Vérifier que le fichier d'entrée existe
        if not os.path.exists(input_file):
            raise FileNotFoundError(f"Fichier non trouvé: {input_file}")
        
        # Traiter le fichier
        processed_clients = process_csv_file(input_file, output_file)
        
        print(f"\n✅ Traitement terminé avec succès!")
        print(f"📄 Fichier de sortie: {output_file}")
        print(f"👥 Nombre de clients à importer: {len(processed_clients)}")
        
    except Exception as e:
        print(f"❌ Erreur lors du traitement: {str(e)}")
        raise

if __name__ == "__main__":
    main()
