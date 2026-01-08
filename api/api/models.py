from pydantic import BaseModel

class PredictRequest(BaseModel):
    hardness_value: float
    target_depth: float
    load_weight: float
    weight: float
    is_weight_unknown: int
    recipe_temperature: float
    recipe_carbon_max: float
    recipe_carbon_flow: float
    carbon_percentage: float


class PredictResponse(BaseModel):
    predicted_features: dict
    reconstructed_recipe: list
