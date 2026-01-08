const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

// URL de l'API Python (configurable via variable d'environnement)
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

/**
 * POST /api/recipe/predict
 * Proxy vers l'API Python FastAPI de prédiction de recette
 *
 * Body attendu (9 paramètres) :
 * {
 *   hardness_value: number,
 *   target_depth: number,
 *   load_weight: number,
 *   weight: number,
 *   is_weight_unknown: 0 | 1,
 *   recipe_temperature: number,
 *   recipe_carbon_max: number,
 *   recipe_carbon_flow: number,
 *   carbon_percentage: number
 * }
 *
 * Réponse :
 * {
 *   predicted_features: {
 *     res_first_carb: number,
 *     res_first_diff: number,
 *     res_second_carb: number,
 *     res_second_diff: number,
 *     res_last_carb: number,
 *     res_last_diff: number,
 *     res_final_time: number,
 *     res_num_cycles: number
 *   },
 *   reconstructed_recipe: [[carb, diff], ..., [carb, diff, final]]
 * }
 */
router.post('/predict', authenticate, async (req, res, next) => {
  try {
    const {
      hardness_value,
      target_depth,
      load_weight,
      weight,
      is_weight_unknown,
      recipe_temperature,
      recipe_carbon_max,
      recipe_carbon_flow,
      carbon_percentage
    } = req.body;

    // Validation des paramètres requis
    const requiredFields = [
      'hardness_value',
      'target_depth',
      'load_weight',
      'weight',
      'is_weight_unknown',
      'recipe_temperature',
      'recipe_carbon_max',
      'recipe_carbon_flow',
      'carbon_percentage'
    ];

    const missingFields = requiredFields.filter(field =>
      req.body[field] === undefined || req.body[field] === null
    );

    if (missingFields.length > 0) {
      logger.warn('Recipe prediction: missing required parameters', {
        missing: missingFields,
        userId: req.user?.id
      });

      return res.status(400).json({
        error: 'Paramètres manquants pour la prédiction',
        missing: missingFields
      });
    }

    // Validation des types et valeurs
    const numericFields = [
      'hardness_value',
      'target_depth',
      'load_weight',
      'weight',
      'recipe_temperature',
      'recipe_carbon_max',
      'recipe_carbon_flow',
      'carbon_percentage'
    ];

    for (const field of numericFields) {
      const value = req.body[field];
      if (typeof value !== 'number' || isNaN(value)) {
        return res.status(400).json({
          error: `Le paramètre '${field}' doit être un nombre valide`,
          field,
          receivedValue: value
        });
      }
    }

    // is_weight_unknown doit être 0 ou 1
    if (![0, 1].includes(is_weight_unknown)) {
      return res.status(400).json({
        error: "Le paramètre 'is_weight_unknown' doit être 0 ou 1",
        receivedValue: is_weight_unknown
      });
    }

    logger.info('Recipe prediction request', {
      userId: req.user?.id,
      params: {
        hardness_value,
        target_depth,
        recipe_temperature
      }
    });

    // Appeler l'API Python avec timeout de 2 minutes (la simulation CBPWin peut être longue)
    const response = await axios.post(
      `${PYTHON_API_URL}/predict`,
      req.body,
      {
        timeout: 120000, // 2 minutes
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('Recipe prediction successful', {
      userId: req.user?.id,
      numCycles: response.data?.predicted_features?.res_num_cycles
    });

    // Retourner la réponse de l'API Python
    res.json(response.data);

  } catch (error) {
    // Gestion des erreurs spécifiques
    if (error.code === 'ECONNREFUSED') {
      logger.error('Python API connection refused', {
        url: PYTHON_API_URL,
        error: error.message
      });

      return res.status(503).json({
        error: 'L\'API de prédiction n\'est pas disponible',
        details: 'Vérifiez que le serveur Python est démarré',
        apiUrl: PYTHON_API_URL
      });
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      logger.error('Python API timeout', {
        url: PYTHON_API_URL,
        timeout: 30000
      });

      return res.status(504).json({
        error: 'L\'API de prédiction n\'a pas répondu dans les délais',
        details: 'La prédiction a pris trop de temps. Réessayez.'
      });
    }

    // Erreur retournée par l'API Python
    if (error.response) {
      logger.error('Python API returned error', {
        status: error.response.status,
        data: error.response.data
      });

      return res.status(error.response.status).json({
        error: 'Erreur lors de la prédiction',
        details: error.response.data?.detail || error.response.data
      });
    }

    // Erreur inconnue
    logger.error('Recipe prediction unknown error', {
      error: error.message,
      stack: error.stack
    });

    next(error);
  }
});

module.exports = router;
