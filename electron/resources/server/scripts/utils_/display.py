# display.py

from prettytable import PrettyTable, ALL  # Importez ALL si disponible
from textwrap import fill
import shutil

def get_terminal_size():
    """
    Obtient la taille du terminal.
    Retourne un tuple (colonnes, lignes).
    """
    return shutil.get_terminal_size()
    
def display_table(data, headers, html_mode, max_col_width=40):
    """
    Affiche un tableau formaté avec gestion des colonnes larges.
    """
    table = PrettyTable()
    table.field_names = headers

    # Configuration des largeurs de colonnes
    for header in headers:
        table.align[header] = "l"
        table.max_width[header] = max_col_width

    # Ajout des données avec gestion des retours à la ligne
    for row in data:
        wrapped_row = []
        for item in row:
            wrapped_row.append(str(item))  # Convertir tous les éléments en chaîne
        table.add_row(wrapped_row)

    # Configurez les règles horizontales (si ALL n'est pas disponible)
    try:
        table.hrules = ALL  # Utilisez ALL si disponible
    except AttributeError:
        table.hrules = 1  # Alternative si ALL n'existe pas

    if html_mode:
        return table.get_html_string()
    else:
        return str(table)


def format_header(header, max_length=35):
    """
    Formate un en-tête pour l'affichage, en le tronquant si nécessaire.
    
    :param header: Chaîne de caractères représentant l'en-tête
    :param max_length: Longueur maximale avant troncature
    :return: En-tête formaté
    """
    if len(header) > max_length:
        return header[:max_length] + "..."
    return header

def display_metadata(metadata, html_mode):
    """
    Affiche les métadonnées d'une requête.
    
    :param metadata: Dictionnaire contenant les métadonnées
    :param html_mode: Booléen indiquant si le format de sortie doit être HTML
    :return: Chaîne de caractères représentant les métadonnées formatées
    """
    headers = ["Champ", "Valeur"]
    data = [
        ["ID", metadata['id']],
        ["Date", metadata['timestamp']],
        ["En-tête", format_header(metadata['header'])],
        ["Pertinence", f"{metadata['relevance']:.2f}%"]
    ]
    return display_table(data, headers, html_mode)

def display_results(results, html_mode):
    """
    Affiche les résultats d'une recherche.
    
    :param results: Liste de dictionnaires contenant les résultats
    :param html_mode: Booléen indiquant si le format de sortie doit être HTML
    :return: Chaîne de caractères représentant les résultats formatés
    """
    if not results:
        return "Aucun résultat trouvé."

    headers = ["ID", "En-tête", "Contenu", "Pertinence"]
    data = [
        [r['id'], 
         format_header(r['header']), 
         r['content'], 
         f"{r['relevance']:.2f}%"] 
        for r in results
    ]
    return display_table(data, headers, html_mode)

# Fonction utilitaire pour l'affichage HTML
def html_wrapper(content):
    """
    Enveloppe le contenu dans une structure HTML basique.
    
    :param content: Contenu HTML à envelopper
    :return: Page HTML complète
    """
    return f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Résultats de recherche</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }}
            table {{ border-collapse: collapse; width: 100%; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            th {{ background-color: #f2f2f2; }}
            td {{ word-wrap: break-word; max-width: 300px; }}
        </style>
    </head>
    <body>
        {content}
    </body>
    </html>
    """
