from fastapi import FastAPI
from api.routers.predict import router as predict_router

app = FastAPI(
    title="ECM Recipe Prediction API",
    version="1.0"
)

app.include_router(predict_router)
