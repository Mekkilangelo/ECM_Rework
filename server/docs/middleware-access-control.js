/**
 * DOCUMENTATION DES MIDDLEWARES DE CONTRÔLE D'ACCÈS
 * ==================================================
 * 
 * Ce document décrit l'architecture standardisée des middlewares de contrôle d'accès
 * utilisés dans l'application. Cette standardisation garantit une cohérence dans 
 * la gestion des autorisations et facilite les évolutions futures.
 * 
 * TYPES DE MIDDLEWARE
 * ------------------
 * 
 * Le système dispose de plusieurs niveaux de contrôle d'accès :
 * 
 * 1. `publicAccess` - Aucune authentification requise
 *    - Utilisé pour les routes accessibles sans connexion (GET sur les ressources publiques)
 * 
 * 2. `readAccess` - Authentification requise, lecture seule
 *    - Utilisé pour les routes nécessitant uniquement une authentification
 *    - L'utilisateur doit être connecté mais aucun droit spécifique n'est requis
 * 
 * 3. `writeAccess` - Authentification + droits d'édition + vérification du mode lecture seule global
 *    - Utilisé pour les routes de modification (POST, PUT, DELETE)
 *    - Vérifie si l'utilisateur est authentifié et a les droits d'édition (admin ou superuser)
 *    - Vérifie également si le système n'est pas en mode lecture seule global
 * 
 * 4. `adminAccess` - Authentification + droits admin
 *    - Utilisé pour les routes d'administration (admin ou superuser uniquement)
 *    - Ne vérifie pas le mode lecture seule global
 * 
 * 5. `superUserAccess` - Authentification + droits superuser
 *    - Utilisé pour les routes super-administrateur (superuser uniquement)
 *    - Ne vérifie pas le mode lecture seule global
 * 
 * 6. `adminWriteAccess` - Authentification + droits admin + vérification du mode lecture seule global
 *    - Utilisé pour les routes de modification nécessitant des droits admin
 * 
 * 7. `superUserWriteAccess` - Authentification + droits superuser + vérification du mode lecture seule global
 *    - Utilisé pour les routes de modification nécessitant des droits superuser
 * 
 * UTILISATION
 * ----------
 * 
 * Pour appliquer un middleware à une route, utilisez la syntaxe suivante :
 * 
 * ```javascript
 * const { readAccess, writeAccess } = require('../middleware/access-control');
 * 
 * // Routes en lecture seule (GET)
 * router.get('/', publicAccess, controller.getAll);
 * 
 * // Routes de modification (POST, PUT, DELETE)
 * router.post('/', writeAccess, controller.create);
 * router.put('/:id', writeAccess, controller.update);
 * router.delete('/:id', writeAccess, controller.delete);
 * ```
 * 
 * ÉVOLUTION
 * ---------
 * 
 * Pour ajouter de nouvelles règles de contrôle d'accès :
 * 
 * 1. Ajouter le nouveau middleware dans `middleware/auth.js`
 * 2. Créer une combinaison appropriée dans `middleware/accessControl.js`
 * 3. Utiliser cette combinaison dans les routes concernées
 * 
 * Cette architecture modulaire facilite l'ajout de nouvelles règles sans avoir
 * à modifier l'ensemble des fichiers de routes.
 */
