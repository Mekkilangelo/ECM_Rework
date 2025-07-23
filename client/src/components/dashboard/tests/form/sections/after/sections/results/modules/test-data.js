/**
 * Test de la nouvelle structure des données des courbes
 * 
 * Exemple de données moderne:
 * {
 *   distances: [0, 1, 2, 3, 4, 5],
 *   series: [
 *     {
 *       name: "Dureté HV",
 *       values: [150, 160, 155, 145, 140, 135]
 *     },
 *     {
 *       name: "Position X",
 *       values: [0, 10, 20, 30, 40, 50]
 *     }
 *   ]
 * }
 */

// Exemple de données de test pour import
export const sampleCurveData = {
  distances: [0, 1, 2, 3, 4, 5],
  series: [
    {
      name: "Dureté HV",
      values: [150, 160, 155, 145, 140, 135]
    },
    {
      name: "Position X",
      values: [0, 10, 20, 30, 40, 50]
    }
  ]
};

// Données vides pour test initial
export const emptyCurveData = {
  distances: [0],
  series: []
};

// Test avec plusieurs séries
export const multiSeriesCurveData = {
  distances: [0, 0.5, 1.0, 1.5, 2.0],
  series: [
    {
      name: "Série 1",
      values: [100, 105, 110, 108, 102]
    },
    {
      name: "Série 2", 
      values: [95, 98, 103, 106, 104]
    },
    {
      name: "Série 3",
      values: [88, 92, 96, 99, 97]
    }
  ]
};
