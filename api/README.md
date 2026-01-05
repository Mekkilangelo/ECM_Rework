# ECM Prediction API

### Launch the API

```bash
cd api
docker build -t cbpwin-api .
docker run -p 8000:8000 cbpwin-api
```

Or : uvicorn api.main:app --port 8000

### How to test the api

```python
import requests

url = "http://localhost:8000/predict"

payload = {
"hardness_value": 550.0,
"target_depth": 1.1231661137986535,
"load_weight": 188.0,
"weight": 221,
"is_weight_unknown": 0,
"recipe_temperature": 960,
"recipe_carbon_max": 1.8048598173866892,
"recipe_carbon_flow": 15.36159552340434,
"carbon_percentage": 0.2
}

resp = requests.post(url, json=payload)

print("STATUS:", resp.status_code)
print("RESPONSE:")
print(resp.json())

```

API response:

```json
{
  "predicted_features": {
    "res_first_carb": 132.46099853515625,
    "res_first_diff": 68.16767120361328,
    "res_second_carb": 92.43475341796875,
    "res_second_diff": 59.52431869506836,
    "res_last_carb": 60.47789001464844,
    "res_last_diff": 544.7439575195312,
    "res_final_time": 8045.90185546875,
    "res_num_cycles": 12.18504810333252
  },
  "reconstructed_recipe": [
    [132, 68],
    [92, 60],
    [89, 108],
    [86, 157],
    [83, 205],
    [80, 254],
    [76, 302],
    [73, 351],
    [70, 399],
    [67, 448],
    [64, 496],
    [60, 545, 8046]
  ]
}
```
