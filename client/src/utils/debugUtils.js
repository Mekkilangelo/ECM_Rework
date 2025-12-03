// /**
//  * Utilitaires de débogage pour l'application
//  * Contient des outils qui facilitent l'analyse et le débogage
//  */

// /**
//  * Fonction pour analyser la structure d'un objet et afficher ses propriétés et valeurs
//  * @param {Object} obj - L'objet à analyser
//  * @param {string} objectName - Nom de l'objet à afficher dans les logs
//  * @param {boolean} verbose - Si true, affiche également les valeurs null et undefined
//  */
// export const analyzeObjectStructure = (obj, objectName = 'Object', verbose = false) => {
//   if (!obj) {
//     
//     return;
//   }

//   console.group(`Structure de ${objectName}:`);
  
//   const printProps = (object, prefix = '') => {
//     if (typeof object !== 'object' || object === null) {
//       
//       return;
//     }
    
//     Object.entries(object).forEach(([key, value]) => {
//       const fullPath = prefix ? `${prefix}.${key}` : key;
      
//       if (value === null || value === undefined) {
//         if (verbose) {
//           
//         }
//       } else if (typeof value === 'object' && !Array.isArray(value)) {
//         console.group(`${fullPath} (object)`);
//         printProps(value, '');
//         console.groupEnd();
//       } else if (Array.isArray(value)) {
//         console.group(`${fullPath} (array, length: ${value.length})`);
//         if (value.length > 0) {
//           if (typeof value[0] === 'object' && value[0] !== null) {
//             
//             printProps(value[0], '');
//             if (value.length > 1) {
//               
//             }
//           } else {
//             .join(', ')}${value.length > 3 ? ', ...' : ''}`);
//           }
//         }
//         console.groupEnd();
//       } else {
//         // const valueStr = typeof value === 'string' ? `"${value}"` : value;
//         // `);
//       }
//     });
//   };
  
//   printProps(obj);
//   console.groupEnd();
// };

// /**
//  * Fonction pour tracer l'exécution d'une fonction avec ses paramètres et son résultat
//  * @param {Function} fn - Fonction à tracer
//  * @param {string} fnName - Nom de la fonction (pour l'affichage)
//  * @returns {Function} - Fonction enveloppée qui trace son exécution
//  */
// export const traceFunction = (fn, fnName = 'function') => {
//   return (...args) => {
//     console.group(`Exécution de ${fnName}`);
//     
//     try {
//       const result = fn(...args);
//       if (result instanceof Promise) {
//         return result
//           .then(res => {
//             :', res);
//             console.groupEnd();
//             return res;
//           })
//           .catch(err => {
//             console.error('Erreur (promesse rejetée):', err);
//             console.groupEnd();
//             throw err;
//           });
//       } else {
//         
//         console.groupEnd();
//         return result;
//       }
//     } catch (err) {
//       console.error('Erreur:', err);
//       console.groupEnd();
//       throw err;
//     }
//   };
// };

// export default {
//   analyzeObjectStructure,
//   traceFunction
// };
