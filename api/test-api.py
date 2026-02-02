import requests

url = "http://localhost:8000/predict"
#row 52
payload = {
"hardness_value": 650.0,
"target_depth": 0.5745674205753899,
"load_weight": 407.0,
"weight": 869.0,
"is_weight_unknown": 1,
"recipe_temperature": 920.0,
"recipe_carbon_max": 1.3220459710889527,
"recipe_carbon_flow": 11.855147460483698,
"carbon_percentage": 0.2
}

resp = requests.post(url, json=payload)

print("STATUS:", resp.status_code)
print("RESPONSE:")
print(resp.json())
