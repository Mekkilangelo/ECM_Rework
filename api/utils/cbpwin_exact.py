#!/usr/bin/env python3
"""
Simulateur CBPWin EXACT - Reproduction fidèle du code C++ CBPWinEngineIterative
"""

import math
from typing import List, Tuple

# Constantes CBPWin
CBPWIN_MAX_LAYERS = 2000  # EXACT selon CBPWinCoreCommon.h
CBPWIN_MAX_STEPS = 500    # EXACT selon CBPWinCoreCommon.h

class CBPWinSimulatorExact:
    """Reproduction EXACTE du CBPWinEngineIterative C++"""
    
    def __init__(self):
        # Paramètres par défaut EXACTS du CBPWinSimulation.cpp
        self.default_steel = {
            'name': 'Default steel',
            'initial_carbon': 0.20,  # PARAMÈTRE D'ENTRÉE MODIFIABLE
            'd0_factor': 9.332,
            'k_factor': 21393.1,
            'mass': 7.87
        }
        
        # Variables d'état du moteur
        self.current_step = 0
        self.current_layer_max = 1
        self.current_step_time = 0.0
        self.current_total_time = 0.0
        
        # Tableau des couches (reproduction exacte)
        self.layer_array = [0.0] * (CBPWIN_MAX_LAYERS + 1)  # 2001 éléments
        
        # Facteurs calculés
        self.diffusion_factor_static = 0.0
        self.out_carbon_quantity = 0.0
    
    def initialize_simulation(self, params: dict):
        """Initialisation exacte comme dans CBPWinEngineIterative::calculation()"""
        temperature = params.get('temperature', 950.0)
        carbon_flow = params.get('carbon_flow', 14.0)
        steel = params.get('steel', self.default_steel)
        
        # Calculs EXACTS du code C++
        self.diffusion_factor_static = steel['d0_factor'] * math.exp(-steel['k_factor'] / (temperature + 273.15))
        self.out_carbon_quantity = carbon_flow * (1.0 / (3600.0 * steel['mass'] * 0.05))
        
        # Initialisation des couches avec carbone initial
        initial_carbon = steel['initial_carbon']
        for i in range(CBPWIN_MAX_LAYERS + 1):
            self.layer_array[i] = initial_carbon
        
        # Réinitialisation des compteurs
        self.current_step = 0
        self.current_layer_max = 1
        self.current_total_time = 0.0
        
        print(f"🔧 Initialisation CBPWin:")
        print(f"   Diffusion factor: {self.diffusion_factor_static:.2e}")
        print(f"   Carbon quantity: {self.out_carbon_quantity:.2e}")
        print(f"   Initial carbon: {initial_carbon:.2f}%")
    
    def calc_layers_carburizing(self, carbon_max: float) -> float:
        """
        Reproduction EXACTE de CBPWinEngineIterative::calcLayers() pour carburisation
        AVEC la double boucle do-while et bRestart comme dans le code C++
        """
        step_time = 0.0
        stop = False
        
        out_delta_c = self.out_carbon_quantity  # dOutDeltaC pour carburisation
        
        while not stop:
            restart = False
            current_layer = 1
            ext_delta_c = out_delta_c
            
            while not stop and not restart:
                # Calcul diffusion interne
                layer_n = self.layer_array[current_layer]
                layer_n_plus_1 = self.layer_array[current_layer + 1]
                
                int_delta_c = self.diffusion_factor_static * ((layer_n - layer_n_plus_1) / 0.000025)
                
                # Mise à jour couche
                self.layer_array[current_layer] = layer_n + ext_delta_c - int_delta_c
                
                # Recalcul surface (formule exacte CBPWin)
                self.layer_array[0] = self.layer_array[1] + ((self.layer_array[1] - self.layer_array[2]) / 2.0)
                
                # Condition d'arrêt EXACTE du code C++
                if (current_layer >= self.current_layer_max) and (int_delta_c < 0.000001):
                    self.current_layer_max = current_layer
                    step_time += 1.0
                    self.current_total_time += 1.0
                    
                    # Test condition d'arrêt (stopAutoCarburizing) - UTILISE LE PARAMÈTRE CONFIGURÉ
                    if self.layer_array[0] > carbon_max:
                        stop = True
                    else:
                        restart = True  # Recommencer avec nouvelle seconde
                else:
                    current_layer += 1
                    if current_layer >= CBPWIN_MAX_LAYERS:
                        stop = True
                    else:
                        ext_delta_c = int_delta_c
        
        return step_time
    
    def calc_layers_diffusion(self, carbon_min: float) -> float:
        """
        Reproduction EXACTE de CBPWinEngineIterative::calcLayers() pour diffusion
        """
        step_time = 0.0
        stop = False
        
        out_delta_c = 0.0  # PAS d'apport externe en diffusion
        
        while not stop:
            restart = False
            current_layer = 1
            ext_delta_c = out_delta_c
            
            while not stop and not restart:
                layer_n = self.layer_array[current_layer]
                layer_n_plus_1 = self.layer_array[current_layer + 1]
                
                int_delta_c = self.diffusion_factor_static * ((layer_n - layer_n_plus_1) / 0.000025)
                
                self.layer_array[current_layer] = layer_n + ext_delta_c - int_delta_c
                
                # Recalcul surface
                self.layer_array[0] = self.layer_array[1] + ((self.layer_array[1] - self.layer_array[2]) / 2.0)
                
                if (current_layer >= self.current_layer_max) and (int_delta_c < 0.000001):
                    self.current_layer_max = current_layer
                    step_time += 1.0
                    self.current_total_time += 1.0
                    
                    # Test condition d'arrêt (stopAutoDiffusion) - UTILISE LE PARAMÈTRE CONFIGURÉ
                    if self.layer_array[0] < carbon_min:
                        stop = True
                    else:
                        restart = True
                else:
                    current_layer += 1
                    if current_layer >= CBPWIN_MAX_LAYERS:
                        stop = True
                    else:
                        ext_delta_c = int_delta_c
        
        return step_time
    
    def calc_layers_final(self, carbon_final: float) -> float:
        """
        Reproduction EXACTE de CBPWinEngineIterative::calcLayers() pour final
        """
        step_time = 0.0
        stop = False
        
        out_delta_c = 0.0  # PAS d'apport externe en final
        
        while not stop:
            restart = False
            current_layer = 1
            ext_delta_c = out_delta_c
            
            while not stop and not restart:
                layer_n = self.layer_array[current_layer]
                layer_n_plus_1 = self.layer_array[current_layer + 1]
                
                int_delta_c = self.diffusion_factor_static * ((layer_n - layer_n_plus_1) / 0.000025)
                
                self.layer_array[current_layer] = layer_n + ext_delta_c - int_delta_c
                
                self.layer_array[0] = self.layer_array[1] + ((self.layer_array[1] - self.layer_array[2]) / 2.0)
                
                if (current_layer >= self.current_layer_max) and (int_delta_c < 0.000001):
                    self.current_layer_max = current_layer
                    step_time += 1.0
                    self.current_total_time += 1.0
                    
                    # Test condition d'arrêt (stopAutoFinal) - UTILISE LE PARAMÈTRE CONFIGURÉ
                    if self.layer_array[0] < carbon_final:
                        stop = True
                    else:
                        restart = True
                else:
                    current_layer += 1
                    if current_layer >= CBPWIN_MAX_LAYERS:
                        stop = True
                    else:
                        ext_delta_c = int_delta_c
        
        return step_time
    
    def calculate_effective_depth(self, eff_carbon: float) -> float:
        """
        Reproduction EXACTE de CBPWinEngineIterative::stopAutoEnd()
        """
        # Recherche de la couche où le carbone >= eff_carbon
        i_search = self.current_layer_max
        carb_n = 0.0
        carb_n_plus_1 = 0.0
        
        for i in range(i_search, 0, -1):
            if self.layer_array[i] >= eff_carbon:
                carb_n = self.layer_array[i]
                carb_n_plus_1 = self.layer_array[i + 1]
                i_search = i
                break
        
        # Calcul de la profondeur selon formule CBPWin EXACTE
        if i_search > 1:
            compare_eff_n = (float(i_search) * 0.05) - 0.025
            compare_eff_delta_p = 0.05
        else:
            compare_eff_n = 0.0
            compare_eff_delta_p = 0.025
        
        # Formule CBPWin exacte
        depth = compare_eff_n + (compare_eff_delta_p * ((carb_n - eff_carbon) / (carb_n - carb_n_plus_1)))
        
        return depth
    
    def run_automatic_simulation(self, params: dict) -> List[Tuple[float, float, float, float]]:
        """
        Simulation automatique EXACTE selon CBPWinEngineIterative::calculation()
        """
        carbon_max = params.get('carbon_max', 1.8)
        carbon_min = params.get('carbon_min', 1.0)
        carbon_final = params.get('carbon_final', 0.70)
        target_depth = params.get('target_depth', 2.1)
        eff_carbon = params.get('eff_carbon', 0.36)
        
        print(f"🔥 SIMULATION CBPWin EXACTE")
        print(f"🎯 Seuils: max={carbon_max}%, min={carbon_min}%, final={carbon_final}%")
        print(f"🎯 Profondeur cible: {target_depth} mm, eff_carbon: {eff_carbon}%")
        
        self.initialize_simulation(params)
        
        results = []
        
        print(f"\n📊 STEPS GÉNÉRÉS (algorithme CBPWin exact):")
        print("-" * 60)
        
        # Boucle principale (reproduction de calculation())
        while self.current_step < CBPWIN_MAX_STEPS:
            
            # === PHASE 1: CARBURISATION ===
            carb_time = self.calc_layers_carburizing(carbon_max)
            
            # Sauvegarder l'état après carburisation (comme pOldLayerCarburizing)
            carburizing_layers = self.layer_array.copy()
            
            # === PHASE 2: DIFFUSION ===
            # Copier l'état de carburisation vers diffusion (comme dans le code C++)
            # for (int idx = 0; idx <= m_iCurrentLayerMax; idx++) m_pLayerArray[idx] = pOldLayerCarburizing[idx];
            for idx in range(self.current_layer_max + 1):
                self.layer_array[idx] = carburizing_layers[idx]
            
            diff_time = self.calc_layers_diffusion(carbon_min)
            
            # Sauvegarder l'état après diffusion (comme pOldLayerDiffusion)
            diffusion_layers = self.layer_array.copy()
            
            # === PHASE 3: FINAL ===
            # Copier l'état de diffusion vers final (comme dans le code C++)
            # for (int idx = 0; idx <= m_iCurrentLayerMax; idx++) m_pLayerArray[idx] = pOldLayerDiffusion[idx];
            for idx in range(self.current_layer_max + 1):
                self.layer_array[idx] = diffusion_layers[idx]
            
            final_time = self.calc_layers_final(carbon_final)
            
            # === CALCUL PROFONDEUR EFFECTIVE ===
            effective_depth = self.calculate_effective_depth(eff_carbon)
            
            results.append((carb_time, diff_time, final_time, effective_depth))
            
            print(f"Step {self.current_step + 1}: Carb={carb_time:3.0f}s, Diff={diff_time:3.0f}s, "
                  f"Final={final_time:4.0f}s, Depth={effective_depth:.3f}mm "
                  f"(Surface: {self.layer_array[0]:.2f}%, MaxLayer: {self.current_layer_max})")
            
            # Condition d'arrêt CBPWin (stopAutoEnd)
            if effective_depth >= target_depth or self.current_step >= (CBPWIN_MAX_STEPS - 1):
                print(f"✅ Arrêt: profondeur {effective_depth:.3f}mm >= {target_depth}mm")
                break
            
            # === PRÉPARATION DU STEP SUIVANT ===
            # ATTENTION: Le code C++ copie pOldLayerDiffusion (pas pOldLayerFinal) !
            # m_pLayerArray[idx] = pOldLayerDiffusion[idx];
            for idx in range(self.current_layer_max + 1):
                self.layer_array[idx] = diffusion_layers[idx]  # PAS final_layers !
            
            self.current_step += 1
        
        print(f"\n🏁 SIMULATION TERMINÉE après {self.current_step + 1} steps")
        return results

def main():
    """Test avec paramètres calibrés pour reproduire vos résultats"""
    simulator = CBPWinSimulatorExact()
    
    print("🧪 SIMULATEUR CBPWin EXACT - Test de reproduction")
    print("="*60)
    print("Objectif: Reproduire ces résultats CBPWin:")
    print("(293, 137, 671, 0.334)")
    print("(94, 196, 1150, 0.440)")
    print("(84, 250, 1689, 0.534)")
    print("(79, 303, 2289, 0.623)")
    print("(77, 358, 2961, 0.710)")
    print()
    
    # Paramètres à ajuster pour correspondre aux résultats
    test_params = {
        'temperature': 960.0,    # CBPWin par défaut
        'carbon_flow': 15.4,     # CBPWin par défaut  
        'carbon_max': 1.8,       # CBPWin par défaut
        'carbon_min': 1.0,       # CBPWin par défaut
        'carbon_final': 0.70,     # CBPWin par défaut
        'target_depth': 2.1,    # Ajusté selon vos résultats
        'eff_carbon': 0.36,      # EFFCARBON_042 par défaut
        'steel': {
            'name': 'Test steel',
            'initial_carbon': 0.18,  # PARAMÈTRE AJUSTABLE SELON VOS DONNÉES
            'd0_factor': 9.332,
            'k_factor': 21393.1,
            'mass': 7.87
        }
    }
    
    results = simulator.run_automatic_simulation(test_params)
    
    print(f"\n📊 COMPARAISON avec vos résultats CBPWin:")
    print("Step | Attendu CBPWin        | Simulateur Exact")
    print("-" * 60)
    
    expected = [
        (293, 137, 671, 0.334),
        (94, 196, 1150, 0.440),
        (84, 250, 1689, 0.534),
        (79, 303, 2289, 0.623),
        (77, 358, 2961, 0.710)
    ]
    
    for i, (result, exp) in enumerate(zip(results, expected), 1):
        got_carb, got_diff, got_final, got_depth = result
        exp_carb, exp_diff, exp_final, exp_depth = exp
        
        print(f"{i:2d}   | ({exp_carb:3.0f},{exp_diff:3.0f},{exp_final:4.0f},{exp_depth:.3f}) | "
              f"({got_carb:3.0f},{got_diff:3.0f},{got_final:4.0f},{got_depth:.3f})")

if __name__ == "__main__":
    main()
