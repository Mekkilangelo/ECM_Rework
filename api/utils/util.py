
from typing import Dict, List, Tuple, Union
from utils.cbpwin import CBPWinSimulatorExact


def get_eff_carbon(hardness_value):
    if hardness_value == 700:
        return 0.45
    if hardness_value == 650:
        return 0.42
    elif hardness_value == 600:
        return 0.39
    elif hardness_value == 550:
        return 0.36
    elif hardness_value == 513:
        return 0.32
    else:
        return 0.36
    
def calculate_recipe(predicted_params):
    # Create an instance of the simulator
    simulator = CBPWinSimulatorExact()
    
    # Extract predicted parameters
    process_params = {
        'temperature': predicted_params.get('temperature', 950.0),
        'carbon_flow': predicted_params.get('carbon_flow', 14.0),
        'carbon_max': predicted_params.get('carbon_max', 1.8),
        'carbon_min': predicted_params.get('carbon_min', 1.0),
        'carbon_final': predicted_params.get('carbon_final', 0.7),
        'target_depth': predicted_params.get('target_depth', 2.1),
        'eff_carbon': predicted_params.get('eff_carbon', 0.36),
        'steel': {
            'name': predicted_params.get('steel_name', 'Predicted Steel'),
            'initial_carbon': predicted_params.get('initial_carbon', 0.2)
        }
    }
    
    # Run the automatic simulation
    return simulator.run_automatic_simulation(process_params)
def extract_features(recipe: List[Tuple[int]]) -> Dict[str, Union[int, float]]:
    """Extract compact features from a recipe"""
    carb_times = [cycle[0] for cycle in recipe]
    diff_times = [cycle[1] for cycle in recipe]
    final_time = recipe[-1][2] if len(recipe[-1]) == 3 else 0
    
    num_cycles = len(recipe)
    
    # Core features (8 total)
    features = {
        'num_cycles': num_cycles,
        'first_carb': carb_times[0],
        'first_diff': diff_times[0],
        'second_carb': carb_times[1] if num_cycles > 1 else carb_times[0],
        'second_diff': diff_times[1] if num_cycles > 1 else diff_times[0],
        'last_carb': carb_times[-1],  # Keep these! They're the targets
        'last_diff': diff_times[-1],
        'final_time': final_time,
        # Remove decay/growth - they'll be calculated during reconstruction
    }
    
    return features


def reconstruct_recipe(features: Dict[str, Union[int, float]]) -> List[List[int]]:
    """Reconstruct recipe from features using 2nd cycle as linear trend anchor"""
    num_cycles = int(round(features['res_num_cycles']))
    first_carb = features['res_first_carb']
    first_diff = features['res_first_diff']
    second_carb = features['res_second_carb']
    second_diff = features['res_second_diff']
    last_carb = features['res_last_carb']
    last_diff = features['res_last_diff']
    final_time = features['res_final_time']
    
    recipe = []
    
    # Calculate decay/growth from 2nd cycle to last cycle
    if num_cycles > 2:
        steps = num_cycles - 2
        carb_decay = (second_carb - last_carb) / steps
        diff_growth = (last_diff - second_diff) / steps
    else:
        carb_decay = 0
        diff_growth = 0
    
    for i in range(num_cycles):
        if i == 0:
            carb = int(round(first_carb))
            diff = int(round(first_diff))
        elif i == 1:
            carb = int(round(second_carb))
            diff = int(round(second_diff))
        else:
            steps_from_second = i - 1
            carb = int(round(second_carb - carb_decay * steps_from_second))
            diff = int(round(second_diff + diff_growth * steps_from_second))
        
        if i == num_cycles - 1 and final_time > 0:
            recipe.append([carb, diff, int(round(final_time))])
        else:
            recipe.append([carb, diff])
    
    return recipe