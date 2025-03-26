import argparse
import numpy as np
import pandas as pd
from utils_ import stopwords, mysql_db
#from html_generator import generate_html_file

def process_search(file_path, search_words, min_relevance, debug_mode, use_stopw, html_mode, args):
    output = ""
    try:
        from pathlib import Path
        file_path = Path(file_path)
        if not file_path.exists():
            output += f"Erreur : Le fichier '{file_path}' n'existe pas.\n"
            return output

        stopwords_matrix = stopwords.create_stopwords_matrix(use_stopw)
        if debug_mode:
            output += "\nStopwords enregistrés :\n"
            output += ", ".join(sorted(sum(stopwords_matrix.values(), []))) + "\n"

        filtered_search_words = stopwords.filter_search_terms(search_words, stopwords_matrix, debug_mode)
        if not filtered_search_words:
            output += "\nAucun terme de recherche valide après filtrage des stopwords !\n"
            return output

        if debug_mode:
            output += f"\nTermes recherchés après filtrage : {', '.join(filtered_search_words)}\n"

        with open(file_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()

        results = []
        current_header = None
        current_content = []

        for i, line in enumerate(lines):
            if line.strip().startswith("---"):
                if current_header and current_content:
                    content = "\n".join(current_content)
                    content_cleaned = clean_content(content)
                    relevance = calculate_relevance(content_cleaned, filtered_search_words)
                    if relevance >= min_relevance:
                        results.append((i, current_header, content_cleaned, relevance))
                current_header = line.strip()
                current_content = []
            elif current_header:
                current_content.append(line.strip())

        # Ajouter le dernier résultat si nécessaire
        if current_header and current_content:
            content = "\n".join(current_content)
            content_cleaned = clean_content(content)
            relevance = calculate_relevance(content_cleaned, filtered_search_words)
            if relevance >= min_relevance:
                results.append((len(lines), current_header, content_cleaned, relevance))

        if results:
            mysql_db.create_requests_table()

            num_results = len(results)
            header_message = f"{num_results} résultat(s) trouvé(s) (seuil de pertinence : {min_relevance:.2f}%)"
            
            if html_mode:
                #generate_html_file(results, args.query)
                output += f"<h2>{header_message}</h2>\n"
                output += "Les résultats ont été enregistrés dans un fichier HTML.\n"
            else:
                output += f"\n{header_message}\n"
                for idx, (line_num, header, content, relevance) in enumerate(results, 1):
                    output += f"\nRéponse {idx}\n"
                    output += f"En-tête : {header}\n"
                    output += f"Contenu :\n{content}\n"
                    output += f"Pertinence : {relevance:.2f}%\n"

            for _, header, content, relevance in results:
                mysql_db.save_request(header, _, content, relevance)
        else:
            message = "Aucun résultat trouvé."
            output += f"<p>{message}</p>\n" if html_mode else message + "\n"

    except Exception as e:
        error_message = f"Une erreur s'est produite lors de la recherche : {e}"
        output += f"<p style='color: red;'>{error_message}</p>\n" if html_mode else error_message + "\n"

    return output

def clean_content(content):
    """
    Nettoie le contenu en supprimant les 'None' et les 'NaN'.
    """
    cleaned_lines = []
    for line in content.split('\n'):
        words = [word for word in line.split() if word != 'None' and word != 'NaN']
        if words:  # Ne pas ajouter de lignes vides
            cleaned_lines.append(' '.join(words))
    return '\n'.join(cleaned_lines)

def calculate_relevance(content, search_words):
    """
    Calcule la pertinence du contenu par rapport aux mots recherchés.
    """
    try:
        content_words = content.lower().split()
        total_words = len(search_words)
        if total_words == 0:
            return 0.0
        
        matched_words = sum(1 for word in search_words if word.lower() in content_words)
        relevance = (matched_words / total_words) * 100
        return max(0.0, min(100.0, relevance))
    except Exception:
        return 0.0

def run_program():
    """Fonction principale à appeler pour exécuter le programme."""
    parser = argparse.ArgumentParser(
        description="Système de recherche avancé avec historique",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    subparsers = parser.add_subparsers(dest='command', required=True)

    # Sous-commande pour la recherche
    search_parser = subparsers.add_parser('search', help='Effectuer une recherche')
    search_parser.add_argument("file_path", help="Chemin du fichier à analyser")
    search_parser.add_argument("-q", "--query", required=True, help="Requête entre guillemets")
    search_parser.add_argument("-r", "--relevance", type=float, default=0.0, help="Seuil de pertinence")
    search_parser.add_argument("-d", "--debug", action="store_true", help="Mode debug")
    search_parser.add_argument("-STOPW", "--stopwords", action="store_true", help="Utiliser stopwords MySQL")
    search_parser.add_argument("-HTML", "--html_mode", action="store_true", help="Afficher les résultats en HTML")

    args = parser.parse_args()

    if args.command == 'search':
        result = process_search(
            args.file_path,
            args.query.split(),
            args.relevance,
            args.debug,
            args.stopwords,
            args.html_mode,
            args
        )
        print(result)
    else:
        parser.print_help()

if __name__ == "__main__":
    run_program()
