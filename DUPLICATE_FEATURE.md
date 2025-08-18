# Fonctionnalité de Duplication

## Description
Cette fonctionnalité permet de dupliquer des entités (clients, commandes, pièces, tests) avec un nouveau bouton d'action dans les listes. Lors de la duplication, un nouveau nœud est créé avec les mêmes données que l'entité dupliquée, avec le suffixe "- Copie" ajouté au nom et les codes uniques adaptés.

## Fonctionnalités implémentées

### Côté Serveur
1. **Utilitaire de duplication** (`hierarchyUtils.js`)
   - `duplicateNode()` - Fonction principale de duplication
   - `duplicateEntityData()` - Duplication des données spécifiques par type
   - `generateUniqueCode()` - Génération de codes uniques

2. **Services**
   - `clientService.duplicateClient()`
   - `orderService.duplicateOrder()`
   - `partService.duplicatePart()`
   - `testService.duplicateTest()`

3. **Contrôleurs**
   - Ajout de méthodes `duplicateX()` dans chaque contrôleur

4. **Routes**
   - `POST /clients/:id/duplicate`
   - `POST /orders/:id/duplicate`
   - `POST /parts/:id/duplicate`
   - `POST /tests/:id/duplicate`

### Côté Client
1. **Composant ActionButtons**
   - Ajout du bouton "Dupliquer" avec icône `faCopy`
   - Nouveau prop `onDuplicate`
   - Largeur de colonne ajustée pour accommoder le nouveau bouton

2. **Services client**
   - Méthodes `duplicateX()` ajoutées à tous les services

3. **Listes**
   - `ClientList`, `OrderList`, `PartList`, `TestList`
   - Handlers `handleDuplicateX()` ajoutés
   - Intégration du bouton dupliquer dans ActionButtons

## Comportement
- **Nom** : Le nom original + " - Copie"
- **Codes uniques** : Pour éviter les conflits, les codes sont adaptés
  - `client_code` : "CODE123" → "CODE123-Copie"
  - `order_number` : "ORD456" → "ORD456-Copie"
  - `test_code` : "TEST789" → "TEST789-Copie"
- **Data status** : Défini à "new"
- **Hiérarchie** : Maintenue (même parent)
- **Horodatage** : `modified_at` mis à jour pour le nouveau nœud et ses ancêtres

## Droits d'accès
- Seuls les utilisateurs avec droits d'écriture (admin/superuser) peuvent dupliquer
- Respecte le mode lecture seule global

## Messages utilisateur
- Succès : "X dupliqué avec succès"
- Erreur : "Erreur lors de la duplication de X"

## Icônes et couleurs
- Icône : `faCopy` (FontAwesome)
- Couleur : `outline-success` (vert)
- Position : Entre "Modifier" et "Supprimer"
