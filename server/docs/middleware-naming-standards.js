/**
 * DOCUMENTATION DU SYSTÈME DE MIDDLEWARES D'AUTHENTIFICATION ET D'AUTORISATIONS
 * ===========================================================================
 * 
 * Cette documentation explique la structure normalisée des middlewares d'authentification
 * et d'autorisation utilisés dans l'application.
 * 
 * MIDDLEWARES INDIVIDUELS (auth.js)
 * --------------------------------
 * 
 * Ces middlewares sont les blocs de base qui peuvent être utilisés individuellement
 * ou combinés pour créer des stratégies d'accès complètes.
 * 
 * 1. `authenticate` - Vérifie si l'utilisateur est authentifié
 *    - Vérifie la présence et la validité du token JWT
 *    - Vérifie le délai d'inactivité
 *    - Charge les informations de l'utilisateur
 * 
 * 2. `validateRefreshToken` - Version spéciale de l'authentification pour le rafraîchissement des tokens
 *    - Plus tolérant sur l'expiration et l'inactivité
 *    - Utilisé uniquement pour la route de rafraîchissement des tokens
 * 
 * 3. `authorizeRoles` - Vérifie si l'utilisateur a l'un des rôles spécifiés
 *    - Fonction d'ordre supérieur qui accepte une liste de rôles autorisés
 *    - Exemple d'utilisation: authorizeRoles('admin', 'moderator')
 * 
 * 4. `requireAdmin` - Vérifie si l'utilisateur a des droits d'administrateur
 *    - Autorise les utilisateurs ayant le rôle 'admin' ou 'superuser'
 * 
 * 5. `requireSuperUser` - Vérifie si l'utilisateur a des droits de super administrateur
 *    - Autorise uniquement les utilisateurs ayant le rôle 'superuser'
 * 
 * 6. `requireEditRights` - Vérifie si l'utilisateur a des droits d'édition
 *    - Autorise les utilisateurs ayant le rôle 'admin' ou 'superuser'
 *    - Empêche les utilisateurs en lecture seule de modifier les données
 * 
 * MIDDLEWARES COMBINÉS (accessControl.js)
 * -------------------------------------
 * 
 * Ces middlewares combinent plusieurs vérifications pour simplifier l'application
 * des règles d'accès dans les routes.
 * 
 * 1. `publicAccess` - Aucune authentification requise
 *    - Utilisé pour les routes publiques
 * 
 * 2. `readAccess` - Authentification requise
 *    - Vérifie uniquement si l'utilisateur est authentifié
 *    - Utilisé pour les routes de lecture protégées
 * 
 * 3. `writeAccess` - Authentification + droits d'édition + vérification du mode lecture seule global
 *    - Combine `authenticate`, `globalReadOnlyChecker`, et `requireEditRights`
 *    - Utilisé pour les routes de modification (POST, PUT, DELETE)
 * 
 * 4. `adminAccess` - Authentification + droits administrateur
 *    - Combine `authenticate` et `requireAdmin`
 *    - Utilisé pour les routes d'administration
 * 
 * 5. `superUserAccess` - Authentification + droits super administrateur
 *    - Combine `authenticate` et `requireSuperUser`
 *    - Utilisé pour les routes super-administrateur
 * 
 * 6. `adminWriteAccess` - Authentification + droits admin + vérification mode lecture seule
 *    - Combine `authenticate`, `globalReadOnlyChecker`, et `requireAdmin`
 *    - Utilisé pour les routes de modification administrateur
 * 
 * 7. `superUserWriteAccess` - Authentification + droits superuser + vérification mode lecture seule
 *    - Combine `authenticate`, `globalReadOnlyChecker`, et `requireSuperUser`
 *    - Utilisé pour les routes de modification super-administrateur
 * 
 * UTILISATION DANS LES ROUTES
 * --------------------------
 * 
 * L'utilisation standard dans les fichiers de routes est la suivante:
 * 
 * ```javascript
 * const { readAccess, writeAccess, adminAccess } = require('../middleware/accessControl');
 * 
 * // Route publique
 * router.get('/public', publicAccess, controller.publicMethod);
 * 
 * // Route de lecture (authentifiée)
 * router.get('/protected', readAccess, controller.protectedMethod);
 * 
 * // Route d'écriture (authentifiée + droits d'édition)
 * router.post('/', writeAccess, controller.createMethod);
 * router.put('/:id', writeAccess, controller.updateMethod);
 * router.delete('/:id', writeAccess, controller.deleteMethod);
 * 
 * // Route d'administration
 * router.get('/admin', adminAccess, controller.adminMethod);
 * 
 * // Route d'écriture administrative
 * router.post('/admin/settings', adminWriteAccess, controller.updateSettings);
 * ```
 * 
 * Cette architecture modulaire facilite l'évolution des permissions dans le temps
 * tout en maintenant une cohérence dans le code.
 */
