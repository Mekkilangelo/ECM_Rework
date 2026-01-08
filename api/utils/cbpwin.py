#!/usr/bin/env python3
"""
Simulateur CBPWin - Calcul de la profondeur de carburation d'un acier.
Cette implémentation reproduit fidèlement les calculs du logiciel CBPWin.

Paramètres principaux :
- temperature : Température du traitement (°C)
- carbon_flow : Flux de carbone (%)
- carbon_max : Teneur maximale en carbone visée (%)
- carbon_min : Teneur minimale en carbone visée (%)
- carbon_final : Teneur finale en carbone visée (%)
- target_depth : Profondeur de carburation visée (mm)
- initial_carbon : Teneur initiale en carbone de l'acier (%)
"""

import math
from typing import List, Tuple

# Constantes du modèle CBPWin
CBPWIN_MAX_LAYERS = 2000  # Nombre maximum de couches de simulation
CBPWIN_MAX_STEPS = 500    # Nombre maximum d'étapes de simulation
LAYER_THICKNESS = 0.05    # Épaisseur d'une couche en mm
CONVERGENCE_THRESHOLD = 0.000001  # Seuil de convergence pour la diffusion

# Constantes physiques du modèle de diffusion
DIFFUSION_D0 = 9.332      # Facteur de diffusion D0 (cm²/s)
ACTIVATION_K = 21393.1    # Facteur d'activation K (K)
STEEL_DENSITY = 7.87      # Masse volumique de l'acier (g/cm³)

class CBPWinSimulatorExact:
    """Simulateur de carburation basé sur les formules CBPWin"""
    
    def __init__(self):
        # Paramètres par défaut de l'acier
        self.default_steel = {
            'name': 'Acier par défaut',
            'initial_carbon': 0.20   # Teneur initiale en carbone (%)
        }
        
        # Paramètres process par défaut
        self.default_process = {
            'temperature': 950.0,     # Température de traitement (°C)
            'carbon_flow': 14.0,      # Flux de carbone (%)
            'carbon_max': 1.8,        # Teneur max en carbone visée (%)
            'carbon_min': 1.0,        # Teneur min en carbone visée (%)
            'carbon_final': 0.70,     # Teneur finale en carbone visée (%)
            'target_depth': 2.1,      # Profondeur de carburation visée (mm)
            'eff_carbon': 0.36        # Teneur en carbone effective (%)
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
        
        # Calculs des facteurs de diffusion
        self.diffusion_factor_static = DIFFUSION_D0 * math.exp(-ACTIVATION_K / (temperature + 273.15))
        self.out_carbon_quantity = carbon_flow * (1.0 / (3600.0 * STEEL_DENSITY * 0.05))
        
        # Initialisation des couches avec carbone initial
        initial_carbon = steel['initial_carbon']
        for i in range(CBPWIN_MAX_LAYERS + 1):
            self.layer_array[i] = initial_carbon
        
        # Réinitialisation des compteurs
        self.current_step = 0
        self.current_layer_max = 1
        self.current_total_time = 0.0
        
        # print(f"[Initialisation CBPWin]:")
        # print(f"   Diffusion factor: {self.diffusion_factor_static:.2e}")
        # print(f"   Carbon quantity: {self.out_carbon_quantity:.2e}")
        # print(f"   Initial carbon: {initial_carbon:.2f}%")
    
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
        
        if carb_n == carb_n_plus_1:
            print(f"Warning: carb_n == carb_n_plus_1 ({carb_n} == {carb_n_plus_1}, i_search = {i_search}, eff_carbon = {eff_carbon}, compare_eff_n = {compare_eff_n}, compare_eff_delta_p = {compare_eff_delta_p})")
            return compare_eff_n
        # Formule CBPWin exacte
        depth = compare_eff_n + (compare_eff_delta_p * ((carb_n - eff_carbon) / (carb_n - carb_n_plus_1)))
        
        return depth
    
    def run_automatic_simulation(self, params: dict) -> List[Tuple[float, float, float, float]]:
        """
        Simulation automatique selon l'algorithme CBPWin
        Retourne une liste de tuples (temps_carb, temps_diff, temps_final, profondeur)
        """
        carbon_max = params.get('carbon_max', 1.8)
        carbon_min = params.get('carbon_min', 1.0)
        carbon_final = params.get('carbon_final', 0.70)
        target_depth = params.get('target_depth', 2.1)
        eff_carbon = params.get('eff_carbon', 0.36)
        
        print(f"[DEMARRAGE SIMULATION]")
        print(f"[Objectifs]:")
        print(f"   - Profondeur: {target_depth} mm")
        print(f"   - Carbone: {carbon_max}% -> {carbon_min}% -> {carbon_final}%")
        
        self.initialize_simulation(params)
        
        results = []
        
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
            
            # Condition d'arret CBPWin (stopAutoEnd)
            if effective_depth >= target_depth or self.current_step >= (CBPWIN_MAX_STEPS - 1):
                print(f"[Arret]: profondeur {effective_depth:.3f}mm >= {target_depth}mm")
                break
            
            # === PREPARATION DU STEP SUIVANT ===
            # ATTENTION: Le code C++ copie pOldLayerDiffusion (pas pOldLayerFinal) !
            # m_pLayerArray[idx] = pOldLayerDiffusion[idx];
            for idx in range(self.current_layer_max + 1):
                self.layer_array[idx] = diffusion_layers[idx]  # PAS final_layers !
            
            self.current_step += 1
        
        print(f"\n[SIMULATION TERMINEE] apres {self.current_step + 1} steps")
        return results

def main():
    """Exemple d'utilisation du simulateur avec un cas typique"""
    # Configuration du traitement
    process_params = {
        # Paramètres du process
        'temperature': 900.0,     # Température (°C)
        'carbon_flow': 10.0,      # Flux de carbone (%)
        'carbon_max': 1.34,        # Teneur max visée (%)
        'carbon_min': 0.95,        # Teneur min visée (%)
        'carbon_final': 0.9,     # Teneur finale visée (%)
        'target_depth': 0.95,      # Profondeur visée (mm)
        'eff_carbon': 0.36,       # Teneur effective (%)
        
        # Paramètres de l'acier
        'steel': {
            'name': 'Acier test',
            'initial_carbon': 0.2   # Teneur initiale (%)
        }
    }

    print("\n=== SIMULATEUR DE CARBURATION CBPWin ===")
    
    # Lancement de la simulation
    simulator = CBPWinSimulatorExact()
    results = simulator.run_automatic_simulation(process_params)
    
    # Calcul des temps totaux
    # Le temps total est : somme(carb) + somme(diff) + Final du dernier step
    # Car le temps "Final" du dernier step represente le temps de phase finale total
    total_carb = sum(r[0] for r in results)
    total_diff = sum(r[1] for r in results) + results[-1][2]  # Ajouter le Final du dernier step
    total_time = total_carb + total_diff
    final_depth = results[-1][3]
    
    # Affichage des resultats
    print("\n[Resultat final]:")
    print(f"   Profondeur atteinte: {final_depth:.3f} mm")
    print(f"   Nombre de cycles: {len(results)}")
    print(f"   Temps total du traitement: {total_time/3600:.2f}h ({total_time:.0f}s) = {int(total_time//3600)}h{int((total_time%3600)//60)}min{int(total_time%60)}s")
    print(f"   Detail par phase:")
    print(f"      - Temps carburisation: {total_carb/3600:.2f}h ({total_carb:.0f}s)")
    print(f"      - Temps diffusion (inclut phase finale): {total_diff/3600:.2f}h ({total_diff:.0f}s)")

if __name__ == "__main__":
    main()
