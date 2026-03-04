/**
 * CBPWin Simulator - Port JavaScript du moteur de simulation de carburation.
 * Portage 1:1 de api/utils/cbpwin.py — aucun appel réseau, calcul natif.
 */

// Constantes du modèle CBPWin
const CBPWIN_MAX_LAYERS = 2000;
const CBPWIN_MAX_STEPS = 500;
const DIFFUSION_D0 = 9.332;      // cm²/s
const ACTIVATION_K = 21393.1;    // K
const STEEL_DENSITY = 7.87;      // g/cm³

class CBPWinSimulator {
  constructor() {
    // Tableau des couches (index 0..CBPWIN_MAX_LAYERS)
    this.layerArray = new Array(CBPWIN_MAX_LAYERS + 1).fill(0);
    this.diffusionFactorStatic = 0;
    this.outCarbonQuantity = 0;
    this.currentLayerMax = 1;
    this.currentTotalTime = 0;
  }

  /**
   * Initialisation — portage exact de CBPWinEngineIterative::calculation()
   */
  initialize(params) {
    const { temperature, carbon_flow, initial_carbon } = params;

    this.diffusionFactorStatic =
      DIFFUSION_D0 * Math.exp(-ACTIVATION_K / (temperature + 273.15));
    this.outCarbonQuantity =
      carbon_flow * (1.0 / (3600.0 * STEEL_DENSITY * 0.05));

    for (let i = 0; i <= CBPWIN_MAX_LAYERS; i++) {
      this.layerArray[i] = initial_carbon;
    }

    this.currentLayerMax = 1;
    this.currentTotalTime = 0;
  }

  /**
   * Phase carburation — portage exact de calcLayers() avec apport externe
   */
  calcLayersCarburizing(carbonMax) {
    let stepTime = 0;
    let stop = false;
    const outDeltaC = this.outCarbonQuantity;

    while (!stop) {
      let restart = false;
      let currentLayer = 1;
      let extDeltaC = outDeltaC;

      while (!stop && !restart) {
        const layerN = this.layerArray[currentLayer];
        const layerNPlus1 = this.layerArray[currentLayer + 1];

        const intDeltaC =
          this.diffusionFactorStatic * ((layerN - layerNPlus1) / 0.000025);

        this.layerArray[currentLayer] = layerN + extDeltaC - intDeltaC;
        this.layerArray[0] =
          this.layerArray[1] +
          (this.layerArray[1] - this.layerArray[2]) / 2.0;

        if (
          currentLayer >= this.currentLayerMax &&
          intDeltaC < 0.000001
        ) {
          this.currentLayerMax = currentLayer;
          stepTime += 1;
          this.currentTotalTime += 1;

          if (this.layerArray[0] > carbonMax) {
            stop = true;
          } else {
            restart = true;
          }
        } else {
          currentLayer++;
          if (currentLayer >= CBPWIN_MAX_LAYERS) {
            stop = true;
          } else {
            extDeltaC = intDeltaC;
          }
        }
      }
    }

    return stepTime;
  }

  /**
   * Phase diffusion — portage exact de calcLayers() sans apport externe
   */
  calcLayersDiffusion(carbonMin) {
    let stepTime = 0;
    let stop = false;
    const outDeltaC = 0.0;

    while (!stop) {
      let restart = false;
      let currentLayer = 1;
      let extDeltaC = outDeltaC;

      while (!stop && !restart) {
        const layerN = this.layerArray[currentLayer];
        const layerNPlus1 = this.layerArray[currentLayer + 1];

        const intDeltaC =
          this.diffusionFactorStatic * ((layerN - layerNPlus1) / 0.000025);

        this.layerArray[currentLayer] = layerN + extDeltaC - intDeltaC;
        this.layerArray[0] =
          this.layerArray[1] +
          (this.layerArray[1] - this.layerArray[2]) / 2.0;

        if (
          currentLayer >= this.currentLayerMax &&
          intDeltaC < 0.000001
        ) {
          this.currentLayerMax = currentLayer;
          stepTime += 1;
          this.currentTotalTime += 1;

          if (this.layerArray[0] < carbonMin) {
            stop = true;
          } else {
            restart = true;
          }
        } else {
          currentLayer++;
          if (currentLayer >= CBPWIN_MAX_LAYERS) {
            stop = true;
          } else {
            extDeltaC = intDeltaC;
          }
        }
      }
    }

    return stepTime;
  }

  /**
   * Phase finale — même logique que diffusion avec seuil carbon_final
   */
  calcLayersFinal(carbonFinal) {
    let stepTime = 0;
    let stop = false;
    const outDeltaC = 0.0;

    while (!stop) {
      let restart = false;
      let currentLayer = 1;
      let extDeltaC = outDeltaC;

      while (!stop && !restart) {
        const layerN = this.layerArray[currentLayer];
        const layerNPlus1 = this.layerArray[currentLayer + 1];

        const intDeltaC =
          this.diffusionFactorStatic * ((layerN - layerNPlus1) / 0.000025);

        this.layerArray[currentLayer] = layerN + extDeltaC - intDeltaC;
        this.layerArray[0] =
          this.layerArray[1] +
          (this.layerArray[1] - this.layerArray[2]) / 2.0;

        if (
          currentLayer >= this.currentLayerMax &&
          intDeltaC < 0.000001
        ) {
          this.currentLayerMax = currentLayer;
          stepTime += 1;
          this.currentTotalTime += 1;

          if (this.layerArray[0] < carbonFinal) {
            stop = true;
          } else {
            restart = true;
          }
        } else {
          currentLayer++;
          if (currentLayer >= CBPWIN_MAX_LAYERS) {
            stop = true;
          } else {
            extDeltaC = intDeltaC;
          }
        }
      }
    }

    return stepTime;
  }

  /**
   * Calcul profondeur effective — portage exact de stopAutoEnd()
   */
  calculateEffectiveDepth(effCarbon) {
    let iSearch = this.currentLayerMax;
    let carbN = 0.0;
    let carbNPlus1 = 0.0;

    for (let i = iSearch; i >= 1; i--) {
      if (this.layerArray[i] >= effCarbon) {
        carbN = this.layerArray[i];
        carbNPlus1 = this.layerArray[i + 1];
        iSearch = i;
        break;
      }
    }

    let compareEffN, compareEffDeltaP;
    if (iSearch > 1) {
      compareEffN = iSearch * 0.05 - 0.025;
      compareEffDeltaP = 0.05;
    } else {
      compareEffN = 0.0;
      compareEffDeltaP = 0.025;
    }

    if (carbN === carbNPlus1) {
      return compareEffN;
    }

    return (
      compareEffN +
      compareEffDeltaP * ((carbN - effCarbon) / (carbN - carbNPlus1))
    );
  }

  /**
   * Construit un snapshot { depth, carbon }[] depuis l'état courant du layerArray.
   */
  _buildProfile() {
    const max = Math.min(this.currentLayerMax + 5, CBPWIN_MAX_LAYERS);
    const profile = [];
    for (let i = 0; i <= max; i++) {
      profile.push({
        depth: parseFloat((i * 0.05).toFixed(3)),
        carbon: parseFloat(Math.max(0, this.layerArray[i]).toFixed(6)),
      });
    }
    return profile;
  }

  /**
   * Simulation automatique — portage exact de run_automatic_simulation()
   * Retourne un historique avec un snapshot Boost + Diffusion par cycle.
   * @param {Object} params
   * @returns {{ history: Array, summary: Object }}
   */
  runSimulation(params) {
    const { carbon_max, carbon_min, carbon_final, target_depth, eff_carbon } = params;
    this.initialize(params);

    const history = [];
    let totalCarb = 0;
    let totalDiff = 0;
    let lastFinalTime = 0;
    let finalDepth = 0;
    let numCycles = 0;
    let lastFinalProfile = null;
    let lastFinalSurfaceCarbon = 0;

    for (let step = 0; step < CBPWIN_MAX_STEPS; step++) {
      numCycles = step + 1;

      // === Boost (Cémentation) ===
      const carbTime = this.calcLayersCarburizing(carbon_max);
      totalCarb += carbTime;
      const carburizingSnapshot = this.layerArray.slice(0, this.currentLayerMax + 1);

      history.push({
        cycle: step + 1,
        phase: 'Boost',
        duration: carbTime,
        surfaceCarbon: parseFloat(Math.max(0, this.layerArray[0]).toFixed(4)),
        depth: Math.round(this.calculateEffectiveDepth(eff_carbon) * 1000) / 1000,
        profile: this._buildProfile(),
      });

      // === Diffusion ===
      for (let i = 0; i <= this.currentLayerMax; i++) {
        this.layerArray[i] = carburizingSnapshot[i];
      }
      const diffTime = this.calcLayersDiffusion(carbon_min);
      totalDiff += diffTime;
      const diffusionSnapshot = this.layerArray.slice(0, this.currentLayerMax + 1);

      history.push({
        cycle: step + 1,
        phase: 'Diffusion',
        duration: diffTime,
        surfaceCarbon: parseFloat(Math.max(0, this.layerArray[0]).toFixed(4)),
        depth: Math.round(this.calculateEffectiveDepth(eff_carbon) * 1000) / 1000,
        profile: this._buildProfile(),
      });

      // === Final (mesure ECD — non exposé dans l'historique) ===
      for (let i = 0; i <= this.currentLayerMax; i++) {
        this.layerArray[i] = diffusionSnapshot[i];
      }
      const finalTime = this.calcLayersFinal(carbon_final);
      lastFinalTime = finalTime;
      finalDepth = Math.round(this.calculateEffectiveDepth(eff_carbon) * 1000) / 1000;
      lastFinalProfile = this._buildProfile();
      lastFinalSurfaceCarbon = parseFloat(Math.max(0, this.layerArray[0]).toFixed(4));

      if (finalDepth >= target_depth || step >= CBPWIN_MAX_STEPS - 1) {
        break;
      }

      // Préparer le cycle suivant depuis l'état diffusion
      for (let i = 0; i <= this.currentLayerMax; i++) {
        this.layerArray[i] = diffusionSnapshot[i];
      }
    }

    return {
      history,
      summary: {
        num_cycles: numCycles,
        total_carb: totalCarb,
        total_diff: totalDiff + lastFinalTime,
        total_time: totalCarb + totalDiff + lastFinalTime,
        final_depth: finalDepth,
        last_final_time: lastFinalTime,
        final_entry: lastFinalProfile ? {
          cycle: numCycles,
          phase: 'Final',
          duration: lastFinalTime,
          surfaceCarbon: lastFinalSurfaceCarbon,
          depth: finalDepth,
          profile: lastFinalProfile,
        } : null,
      },
    };
  }
}

/**
 * Lance une simulation CBPWin synchrone.
 * @param {Object} params - { temperature, carbon_flow, carbon_max, carbon_min,
 *                            carbon_final, target_depth, eff_carbon, initial_carbon }
 * @returns {{ steps: Array, summary: Object }}
 */
export function runCBPWinSimulation(params) {
  const sim = new CBPWinSimulator();
  return sim.runSimulation(params);
}
