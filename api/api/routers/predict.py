from fastapi import APIRouter
from api.models import PredictRequest, PredictResponse
from api.services.predictor import PredictorService

router = APIRouter()
predictor = PredictorService()


@router.post("/predict", response_model=PredictResponse)
def predict_recipe(req: PredictRequest):
    predicted, recipe = predictor.predict(req)
    return PredictResponse(
        predicted_features=predicted,
        reconstructed_recipe=recipe
    )
