/**
 * Utilitaire pour désactiver la molette de la souris sur les champs input[type="number"]
 * Cela empêche la modification accidentelle des valeurs lors du scroll de la page
 */

/**
 * Désactive l'événement wheel sur un élément input[type="number"]
 * @param {HTMLInputElement} input - L'élément input à modifier
 */
const disableWheelOnInput = (input) => {
  if (input.type === 'number') {
    input.addEventListener('wheel', (event) => {
      // Empêcher le comportement par défaut (changement de valeur)
      event.preventDefault();
      // Empêcher la propagation pour éviter d'interférer avec le scroll de la page
      // event.stopPropagation(); // On ne l'utilise pas pour permettre le scroll de la page
    }, { passive: false });
    
    // Optionnel : désactiver aussi les touches fléchées quand l'input n'est pas focalisé
    input.addEventListener('blur', () => {
      input.addEventListener('keydown', preventArrowKeys);
    });
    
    input.addEventListener('focus', () => {
      input.removeEventListener('keydown', preventArrowKeys);
    });
  }
};

/**
 * Fonction pour empêcher les touches fléchées de modifier la valeur
 * @param {KeyboardEvent} event - L'événement clavier
 */
const preventArrowKeys = (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
  }
};

/**
 * Initialise la désactivation de la molette sur tous les inputs number existants
 */
const initDisableNumberInputWheel = () => {
  // Désactiver sur tous les inputs number existants
  const numberInputs = document.querySelectorAll('input[type="number"]');
  numberInputs.forEach(disableWheelOnInput);
  
  // Observer les nouveaux inputs number ajoutés dynamiquement
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Vérifier si le noeud ajouté est un input number
          if (node.tagName === 'INPUT' && node.type === 'number') {
            disableWheelOnInput(node);
          }
          
          // Vérifier les inputs number dans les enfants du noeud ajouté
          const childNumberInputs = node.querySelectorAll?.('input[type="number"]');
          if (childNumberInputs) {
            childNumberInputs.forEach(disableWheelOnInput);
          }
        }
      });
    });
  });
  
  // Commencer à observer les changements dans le DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Retourner une fonction de nettoyage
  return () => {
    observer.disconnect();
  };
};

/**
 * Désactive manuellement la molette sur un input spécifique
 * Utile pour les composants qui créent des inputs dynamiquement
 * @param {HTMLInputElement|string} inputOrSelector - L'élément input ou un sélecteur CSS
 */
const disableWheelOnNumberInput = (inputOrSelector) => {
  if (typeof inputOrSelector === 'string') {
    const inputs = document.querySelectorAll(inputOrSelector);
    inputs.forEach(disableWheelOnInput);
  } else if (inputOrSelector instanceof HTMLInputElement) {
    disableWheelOnInput(inputOrSelector);
  }
};

export {
  initDisableNumberInputWheel,
  disableWheelOnNumberInput,
  disableWheelOnInput
};

export default initDisableNumberInputWheel;