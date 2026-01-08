import pickle
import numpy as np
import pandas as pd
from utils.util import (
    reconstruct_recipe,
    extract_features,
    calculate_recipe,
    get_eff_carbon
)

XGB_MODEL_PATH = "models/best_recipe_model_XGBoost.pkl"


class PredictorService:

    def __init__(self):
        with open(XGB_MODEL_PATH, "rb") as f:
            self.model = pickle.load(f)

    def build_full_feature_row(self, req):
        """
        Step 1: Create minimal input feature row (only your 9 inputs)
        Step 2: Run CBPWin simulator to compute cbpwin_* features
        """

        # === Step 1: Base input features ===
        input_features = {
            "hardness_value": req.hardness_value,
            "target_depth": req.target_depth,
            "load_weight": req.load_weight,
            "weight": req.weight,
            "is_weight_unknown": req.is_weight_unknown,
            "recipe_temperature": req.recipe_temperature,
            "recipe_carbon_max": req.recipe_carbon_max,
            "recipe_carbon_flow": req.recipe_carbon_flow,
            "carbon_percentage": req.carbon_percentage,
        }

        # === Step 2: Build parameters for CBPWin ===
        params = {
            "temperature": req.recipe_temperature,
            "carbon_flow": req.recipe_carbon_flow,
            "carbon_max": req.recipe_carbon_max,
            "carbon_min": 0.7*req.recipe_carbon_max,
            "carbon_final": 0.69*req.recipe_carbon_max,
            "target_depth": req.target_depth,
            "eff_carbon": get_eff_carbon(req.hardness_value),
            "steel_name": "Predicted Steel",
            "initial_carbon": req.carbon_percentage
        }

        # Run simulator
        sim_results = calculate_recipe(params)

        # Convert into cbpwin features
        modified_results = [(r[0], r[1]) for r in sim_results[:-1]]
        modified_results.append((sim_results[-1][0], sim_results[-1][1], sim_results[-1][2]))

        cbpwin_features = extract_features(modified_results)

        renames_features = {
        'cbpwin_first_carb': cbpwin_features['first_carb'],
        'cbpwin_first_diff': cbpwin_features['first_diff'],
        'cbpwin_second_carb': cbpwin_features['second_carb'],
        'cbpwin_second_diff': cbpwin_features['second_diff'],
        'cbpwin_last_carb': cbpwin_features['last_carb'],
        'cbpwin_last_diff': cbpwin_features['last_diff'],
        'cbpwin_final_time': cbpwin_features['final_time'],
        'cbpwin_num_cycles': cbpwin_features['num_cycles'],
    }
    

        # Merge base + cbpwin features
        full_features = {**input_features, **renames_features}

        return pd.DataFrame([full_features])

    def predict(self, req):
        """
        Returns: predicted Y + reconstructed recipe
        """
        X = self.build_full_feature_row(req)

        # Predict the 8 regression targets
        y_pred = self.model.predict(X)[0]

        output_names = [
            'res_first_carb', 'res_first_diff', 'res_second_carb', 'res_second_diff',
            'res_last_carb', 'res_last_diff', 'res_final_time', 'res_num_cycles'
        ]

        predicted_features = {
            name: float(y_pred[i]) for i, name in enumerate(output_names)
        }

        # Reconstruct recipe
        reconstructed = reconstruct_recipe(predicted_features)

        return predicted_features, reconstructed
