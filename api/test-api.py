import requests

url = "http://localhost:8000/predict"

payload = {
    "hardness_value": 600.0,
    "target_depth": 0.28,
    "load_weight": 341,
    "weight": 958,
    "is_weight_unknown": 1,
    "recipe_temperature": 860,
    "recipe_carbon_max": 0.755,
    "recipe_carbon_flow": 7.9999,
    "carbon_percentage": 0.14
}

resp = requests.post(url, json=payload)

print("STATUS:", resp.status_code)
print("RESPONSE:")
print(resp.json())
