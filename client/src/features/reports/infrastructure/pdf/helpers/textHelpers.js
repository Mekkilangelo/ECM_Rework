/**
 * Calcule la taille de police optimale pour un texte donné afin qu'il tienne dans l'espace disponible.
 * 
 * @param {string} text - Le texte à afficher
 * @param {number} minSize - Taille minimale de la police
 * @param {number} maxSize - Taille maximale de la police (taille par défaut)
 * @param {number} thresholdChars - Nombre de caractères à partir duquel on commence à réduire la taille
 * @param {number} decrementPerChar - Réduction de taille par caractère supplémentaire
 * @returns {number} - La taille de police calculée
 */
export const calculateFontSize = (text, minSize = 10, maxSize = 20, thresholdChars = 20, decrementPerChar = 0.5) => {
  if (!text) return maxSize;

  const length = text.length;

  if (length <= thresholdChars) {
    return maxSize;
  }

  const extraChars = length - thresholdChars;
  const reducionAmount = extraChars * decrementPerChar;
  const newSize = maxSize - reducionAmount;

  return Math.max(newSize, minSize);
};
