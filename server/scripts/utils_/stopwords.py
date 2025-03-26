# stopwords.py

def create_stopwords_matrix(use_stopw):
    stopwords_matrix = {
        'fr': ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais', 'donc', 'car', 'à', 'dans', 'par', 'pour', 'en', 'sur', 'avec'],
        'en': ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after']
    }
    
    if not use_stopw:
        return {}
    return stopwords_matrix

def filter_search_terms(search_terms, stopwords_matrix, debug_mode=False):
    filtered_terms = []
    for term in search_terms:
        # Conserver les termes alphanumériques et les nombres
        if term.isalnum():
            filtered_terms.append(term)
        elif term.lower() not in sum(stopwords_matrix.values(), []):
            filtered_terms.append(term)
    
    if debug_mode:
        print(f"Termes de recherche après filtrage : {filtered_terms}")
    
    return filtered_terms
