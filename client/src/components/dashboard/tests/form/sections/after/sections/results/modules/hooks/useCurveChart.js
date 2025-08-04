import { useMemo } from 'react';

/**
 * Hook pour gérer le graphique des courbes avec échelle proportionnelle
 * Gestion améliorée des valeurs nulles et zéro
 */
export const useCurveChart = (curveData, options = {}) => {
  // Palette de couleurs pour les courbes
  const colorPalette = [
    { borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)' },   // Rose
    { borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.5)' },   // Turquoise
    { borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.5)' },   // Bleu
    { borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.5)' },   // Orange
    { borderColor: 'rgb(153, 102, 255)', backgroundColor: 'rgba(153, 102, 255, 0.5)' }, // Violet
    { borderColor: 'rgb(255, 205, 86)', backgroundColor: 'rgba(255, 205, 86, 0.5)' }    // Jaune
  ];

  /**
   * Fonction utilitaire pour vérifier si une valeur est considérée comme valide
   * @param {*} value - La valeur à vérifier
   * @returns {boolean} - true si la valeur est valide (non nulle, non vide, > 0)
   */
  const isValidValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    const numValue = Number(value);
    return !isNaN(numValue) && numValue > 0;
  };

  /**
   * Fonction pour créer les points valides d'une série en filtrant les valeurs nulles/zéro
   * @param {Array} distances - Tableau des distances
   * @param {Array} values - Tableau des valeurs de la série
   * @returns {Array} - Tableau des points valides {x, y}
   */
  const createValidPoints = (distances, values) => {
    const points = [];
    
    for (let i = 0; i < distances.length && i < values.length; i++) {
      const distance = Number(distances[i]);
      const value = values[i];
      
      // Vérifier que la distance est valide
      if (isNaN(distance)) {
        continue;
      }
      
      // Si la valeur est valide, l'ajouter
      if (isValidValue(value)) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          points.push({
            x: distance,
            y: numValue
          });
        }
      }
    }
    
    return points;
  };

  // Données formatées pour Chart.js avec gestion améliorée des valeurs nulles
  const chartData = useMemo(() => {
    if (!curveData || !curveData.distances || !curveData.series) {
      return {
        datasets: []
      };
    }

    const datasets = curveData.series.map((serie, index) => {
      const colorIndex = index % colorPalette.length;
      const colors = colorPalette[colorIndex];
      
      // Créer les points valides uniquement (filtrage des zéros et valeurs nulles)
      const validPoints = createValidPoints(curveData.distances, serie.values);
      
      return {
        label: serie.name || `Série ${index + 1}`,
        data: validPoints,
        borderColor: colors.borderColor,
        backgroundColor: colors.backgroundColor,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.1,
        fill: false,
        showLine: true,
        // Configuration importante pour gérer les discontinuités
        spanGaps: true, // Connecte les points même s'il y a des gaps dans les données
        // Configuration pour les segments discontinus améliorée
        segment: {
          borderDash: ctx => {
            // Si l'écart entre deux points consécutifs est important,
            // on utilise une ligne pointillée pour indiquer l'interpolation
            const p0 = ctx.p0;
            const p1 = ctx.p1;
            
            if (p0 && p1) {
              const gap = Math.abs(p1.parsed.x - p0.parsed.x);
              
              // Calculer l'écart "normal" basé sur l'ensemble des distances valides
              // On cherche l'écart minimum entre deux distances consécutives
              let minGap = Infinity;
              const sortedDistances = [...new Set(curveData.distances.map(d => Number(d)))]
                .filter(d => !isNaN(d))
                .sort((a, b) => a - b);
              
              for (let i = 1; i < sortedDistances.length; i++) {
                const currentGap = sortedDistances[i] - sortedDistances[i-1];
                if (currentGap > 0 && currentGap < minGap) {
                  minGap = currentGap;
                }
              }
              
              // Si on n'a pas trouvé d'écart minimum valide, utiliser une valeur par défaut
              if (minGap === Infinity) {
                minGap = 1;
              }
              
              // Utiliser une ligne pointillée seulement si l'écart est significativement plus grand
              // que l'écart minimum multiplié par 2.5 (seuil ajustable)
              if (gap > minGap * 2.5) {
                return [5, 5]; // Ligne pointillée pour les gros gaps
              }
            }
            
            return undefined; // Ligne continue normale
          }
        }
      };
    });

    // Ajouter les lignes de spécification ECD si disponibles
    if (options.specifications && options.specifications.ecdSpecs && Array.isArray(options.specifications.ecdSpecs)) {
      console.log('🔍 useCurveChart - Traitement des specs ECD:', options.specifications.ecdSpecs);
      
      // Couleurs originales plus foncées pour les lignes ECD
      const ecdColors = [
        '#2c3e50', // Bleu foncé
        '#34495e', // Gris foncé
        '#1a252f', // Noir bleuté
        '#27292d', // Noir grisâtre
        '#1e1e1e', // Noir profond
      ];

      // Calculer l'étendue des données existantes pour dessiner les lignes ECD
      let minX = Infinity;
      let maxX = -Infinity;
      
      datasets.forEach(dataset => {
        dataset.data.forEach(point => {
          minX = Math.min(minX, point.x);
          maxX = Math.max(maxX, point.x);
        });
      });

      console.log('🔍 useCurveChart - Étendue X des données:', { minX, maxX });

      // Si pas de données principales, utiliser une étendue par défaut
      if (minX === Infinity || maxX === -Infinity) {
        minX = 0;
        maxX = 10;
        console.log('🔍 useCurveChart - Pas de données principales, utilisation étendue par défaut:', { minX, maxX });
      }

      // Ajouter chaque spécification ECD comme ligne horizontale
      options.specifications.ecdSpecs.forEach((ecdSpec, index) => {
        console.log('🔍 useCurveChart - Traitement ECD spec:', ecdSpec, 'index:', index);
        
        // Adapter le format des données ECD
        let yValue = null;
        let range = '';
        let depthMin = null;
        let depthMax = null;
        
        // Essayer de récupérer la valeur Y (hardness)
        if (ecdSpec.hardness) {
          yValue = ecdSpec.hardness;
        } else if (ecdSpec.yValue) {
          yValue = ecdSpec.yValue;
        }
        
        // Essayer de récupérer les valeurs min et max de profondeur
        if (ecdSpec.depthMin !== undefined && ecdSpec.depthMin !== null) {
          depthMin = parseFloat(ecdSpec.depthMin);
        }
        if (ecdSpec.depthMax !== undefined && ecdSpec.depthMax !== null) {
          depthMax = parseFloat(ecdSpec.depthMax);
        }
        
        // Essayer de construire le range
        if (depthMin !== null && depthMax !== null) {
          range = `${depthMin}-${depthMax}${ecdSpec.depthUnit || 'mm'}`;
        } else if (ecdSpec.range) {
          range = ecdSpec.range;
          
          // Si on a le range au format texte mais pas les valeurs numériques,
          // essayer de les extraire (ex: "0.6-0.9mm")
          if (depthMin === null || depthMax === null) {
            const rangeMatch = ecdSpec.range.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
            if (rangeMatch) {
              depthMin = parseFloat(rangeMatch[1]);
              depthMax = parseFloat(rangeMatch[2]);
            }
          }
        }
        
        console.log('🔍 useCurveChart - Valeurs adaptées:', { yValue, depthMin, depthMax, range });
        
        if (yValue !== null && depthMin !== null && depthMax !== null) {
          const colorIndex = index % ecdColors.length;
          const color = ecdColors[colorIndex];
          
          // Créer le label avec le format "ECD: 0.6-0.9mm at 555 HRC"
          const unit = ecdSpec.hardnessUnit || options.unit || 'HV';
          const label = `ECD${index > 0 ? index + 1 : ''}: ${range} at ${yValue} ${unit}`;
          
          console.log('🔍 useCurveChart - Création ligne ECD limitée:', { label, yValue, depthMin, depthMax, color });
          
          // Créer une ligne horizontale UNIQUEMENT entre depthMin et depthMax
          const ecdDataset = {
            label: label,
            data: [
              { x: depthMin, y: parseFloat(yValue) },
              { x: depthMax, y: parseFloat(yValue) }
            ],
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2.5, // Épaisseur légèrement augmentée pour meilleure visibilité
            borderDash: [8, 4], // Pointillés discrets
            pointRadius: 0, // Pas de points visibles
            pointHoverRadius: 0,
            tension: 0,
            fill: false,
            showLine: true,
            spanGaps: false,
            order: 10, // Dessiner après les courbes principales
            hidden: false
          };
          
          console.log('🔍 useCurveChart - Dataset ECD créé:', ecdDataset);
          datasets.push(ecdDataset);
        } else {
          console.warn('🔍 useCurveChart - ECD spec invalide, yValue ou range manquant:', { yValue, range, originalSpec: ecdSpec });
        }
      });
      
      console.log('🔍 useCurveChart - Datasets finaux avec ECD:', datasets);
    } else {
      console.log('🔍 useCurveChart - Pas de specs ECD trouvées dans options:', options);
    }

    return {
      datasets
    };
  }, [curveData, options.specifications]);

  // Options du graphique avec axe X linéaire
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: options.title || 'Courbes de dureté',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        filter: function(tooltipItem) {
          // Ne pas afficher les tooltips pour les points avec une valeur <= 0
          return tooltipItem.parsed.y > 0;
        },
        callbacks: {
          title: function(context) {
            return `Distance: ${context[0].parsed.x} mm`;
          },
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} ${options.unit || 'HV'}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        display: true,
        title: {
          display: true,
          text: 'Distance (mm)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          maxTicksLimit: 10,
          callback: function(value) {
            return value + ' mm';
          }
        }
      },
      y: {
        type: 'linear',
        display: true,
        title: {
          display: true,
          text: options.yAxisLabel || `Dureté (${options.unit || 'HV'})`,
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        beginAtZero: options.beginAtZero !== false,
        // Amélioration: ajuster automatiquement l'échelle Y pour une meilleure visibilité
        afterDataLimits: function(scale) {
          // Si on a des données et qu'on ne force pas à commencer à zéro
          if (!options.beginAtZero && scale.max > 0) {
            const range = scale.max - scale.min;
            // Ajouter une marge de 10% en haut et en bas pour une meilleure visibilité
            scale.max = scale.max + (range * 0.1);
            scale.min = Math.max(0, scale.min - (range * 0.1));
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.1
      },
      point: {
        radius: 4,
        hoverRadius: 6
      }
    }
  }), [options]);

  // Vérifier si le graphique a des données valides à afficher
  const hasData = useMemo(() => {
    if (!chartData.datasets || chartData.datasets.length === 0) {
      return false;
    }
    
    // Vérifier qu'au moins un dataset a des points valides
    return chartData.datasets.some(dataset => 
      dataset.data && dataset.data.length > 0 && 
      dataset.data.some(point => point.y > 0)
    );
  }, [chartData]);

  // Statistiques utiles pour le debug et l'affichage
  const stats = useMemo(() => {
    if (!curveData || !curveData.series) {
      return { totalPoints: 0, validPoints: 0, skippedPoints: 0 };
    }

    let totalPoints = 0;
    let validPoints = 0;
    let skippedPoints = 0;

    curveData.series.forEach(serie => {
      if (serie.values) {
        totalPoints += serie.values.length;
        serie.values.forEach(value => {
          if (isValidValue(value)) {
            validPoints++;
          } else {
            skippedPoints++;
          }
        });
      }
    });

    return { totalPoints, validPoints, skippedPoints };
  }, [curveData]);

  return {
    chartData,
    chartOptions,
    hasData,
    colorPalette,
    stats // Ajout des statistiques pour debug/info
  };
};