// Utilitaire pour surveiller les performances et identifier les goulots d'étranglement
class PerformanceMonitor {
  constructor() {
    this.timings = new Map();
    this.renderCounts = new Map();
    this.apiCalls = new Map();
    this.duplicateRequests = new Map();
    this.isDebugMode = process.env.NODE_ENV === 'development';
  }

  // Démarrer un timer pour une opération
  startTimer(operation) {
    if (!this.isDebugMode) return;
    this.timings.set(operation, performance.now());
  }

  // Arrêter un timer et log le temps écoulé
  endTimer(operation, context = '') {
    if (!this.isDebugMode) return;
    
    const startTime = this.timings.get(operation);
    if (startTime) {
      const duration = performance.now() - startTime;
      if (duration > 100) { // Log seulement si > 100ms
        console.warn(`⚡ Performance Warning: ${operation} ${context} took ${duration.toFixed(2)}ms`);
      }
      this.timings.delete(operation);
      return duration;
    }
  }

  // Compter les re-renders d'un composant
  trackRender(componentName) {
    if (!this.isDebugMode) return;
    
    const count = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, count + 1);
    
    // Alerter si trop de re-renders
    if (count > 10) {
      // console.warn(`🔄 Render Warning: ${componentName} has rendered ${count} times. Check for unnecessary re-renders.`);
    }
  }

  // Tracker les appels API pour détecter les duplicatas
  trackApiCall(endpoint, key = null) {
    if (!this.isDebugMode) return;
    
    const apiKey = key || endpoint;
    const now = Date.now();
    
    if (!this.apiCalls.has(apiKey)) {
      this.apiCalls.set(apiKey, []);
    }
    
    const calls = this.apiCalls.get(apiKey);
    calls.push(now);
    
    // Nettoyer les appels anciens (> 5 secondes)
    const recentCalls = calls.filter(time => now - time < 5000);
    this.apiCalls.set(apiKey, recentCalls);
    
    // Détecter les requêtes dupliquées
    if (recentCalls.length > 1) {
      const duplicateCount = this.duplicateRequests.get(apiKey) || 0;
      this.duplicateRequests.set(apiKey, duplicateCount + 1);
      
      if (duplicateCount > 2) {
        console.warn(`📡 API Warning: Duplicate request to ${endpoint} (${recentCalls.length} calls in 5s). Consider caching or debouncing.`);
      }
    }
  }

  // Rapport de performance
  getPerformanceReport() {
    if (!this.isDebugMode) return null;
    
    return {
      renderCounts: Object.fromEntries(this.renderCounts),
      apiCallFrequency: Object.fromEntries(
        Array.from(this.apiCalls.entries()).map(([key, calls]) => [
          key, 
          calls.length
        ])
      ),
      duplicateRequests: Object.fromEntries(this.duplicateRequests)
    };
  }

  // Obtenir un résumé complet des performances
  getPerformanceSummary() {
    if (!this.isDebugMode) return null;
    
    const summary = {
      topRenderingComponents: this.getTopRenderingComponents(),
      mostFrequentApiCalls: this.getMostFrequentApiCalls(),
      duplicateRequestsCount: this.duplicateRequests.size,
      totalApiCalls: Array.from(this.apiCalls.values()).reduce((total, calls) => total + calls.length, 0),
      averageRenderCount: this.getAverageRenderCount(),
      recommendations: this.getOptimizationRecommendations()
    };
    
    return summary;
  }
  
  // Identifier les composants qui se re-rendent le plus
  getTopRenderingComponents(limit = 5) {
    return Array.from(this.renderCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([component, count]) => ({ component, count }));
  }
  
  // Identifier les appels API les plus fréquents
  getMostFrequentApiCalls(limit = 5) {
    return Array.from(this.apiCalls.entries())
      .map(([endpoint, calls]) => ({ endpoint, count: calls.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
  
  // Calculer le nombre moyen de re-renders
  getAverageRenderCount() {
    const counts = Array.from(this.renderCounts.values());
    return counts.length > 0 ? counts.reduce((sum, count) => sum + count, 0) / counts.length : 0;
  }
  
  // Générer des recommandations d'optimisation
  getOptimizationRecommendations() {
    const recommendations = [];
    
    // Vérifier les composants avec trop de re-renders
    for (const [component, count] of this.renderCounts.entries()) {
      if (count > 15) {
        recommendations.push({
          type: 'excessive_renders',
          component,
          count,
          suggestion: `Consider memoizing ${component} or checking for unnecessary prop/state changes`
        });
      }
    }
    
    // Vérifier les requêtes dupliquées
    for (const [endpoint, count] of this.duplicateRequests.entries()) {
      if (count > 3) {
        recommendations.push({
          type: 'duplicate_requests',
          endpoint,
          count,
          suggestion: `Add caching or debouncing for ${endpoint}`
        });
      }
    }
    
    // Vérifier les appels API très fréquents
    for (const [endpoint, calls] of this.apiCalls.entries()) {
      if (calls.length > 10) {
        recommendations.push({
          type: 'frequent_api_calls',
          endpoint,
          count: calls.length,
          suggestion: `Consider caching responses for ${endpoint}`
        });
      }
    }
    
    return recommendations;
  }
  
  // Afficher un rapport de performance dans la console
  logPerformanceSummary() {
    if (!this.isDebugMode) return;
    
    const summary = this.getPerformanceSummary();
    if (!summary) return;
    
    console.group('📊 Performance Summary');
    
    // Composants avec le plus de re-renders
    if (summary.topRenderingComponents.length > 0) {
      console.group('🔄 Top Rendering Components');
      summary.topRenderingComponents.forEach(({ component, count }) => {
        console.log(`${component}: ${count} renders`);
      });
      console.groupEnd();
    }
    
    // Appels API les plus fréquents
    if (summary.mostFrequentApiCalls.length > 0) {
      console.group('📡 Most Frequent API Calls');
      summary.mostFrequentApiCalls.forEach(({ endpoint, count }) => {
        console.log(`${endpoint}: ${count} calls`);
      });
      console.groupEnd();
    }
    
    // Statistiques générales
    console.log(`Average renders per component: ${summary.averageRenderCount.toFixed(2)}`);
    console.log(`Total API calls: ${summary.totalApiCalls}`);
    console.log(`Endpoints with duplicates: ${summary.duplicateRequestsCount}`);
    
    // Recommandations
    if (summary.recommendations.length > 0) {
      console.group('💡 Optimization Recommendations');
      summary.recommendations.forEach(rec => {
        console.warn(`${rec.type}: ${rec.suggestion}`);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  // Nettoyer les données anciennes
  cleanup() {
    const now = Date.now();
    
    // Nettoyer les appels API anciens
    for (const [key, calls] of this.apiCalls.entries()) {
      const recentCalls = calls.filter(time => now - time < 30000); // 30 secondes
      if (recentCalls.length === 0) {
        this.apiCalls.delete(key);
      } else {
        this.apiCalls.set(key, recentCalls);
      }
    }
    
    // Reset des compteurs de render si inactifs
    if (this.renderCounts.size > 50) {
      this.renderCounts.clear();
    }
  }

  // Log une opération lente
  logSlowOperation(operation, duration, threshold = 1000) {
    if (!this.isDebugMode) return;
    
    if (duration > threshold) {
      console.warn(`🐌 Slow Operation: ${operation} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }
  }
}

// Instance globale pour l'utilisation dans l'application
const performanceMonitor = new PerformanceMonitor();

// Hook pour surveiller les re-renders
export const useRenderTracker = (componentName) => {
  if (process.env.NODE_ENV === 'development') {
    performanceMonitor.trackRender(componentName);
  }
};

// Fonctions utilitaires pour le monitoring des performances
export const startTimer = (operation) => performanceMonitor.startTimer(operation);
export const endTimer = (operation, context) => performanceMonitor.endTimer(operation, context);
export const trackApiCall = (endpoint, key) => performanceMonitor.trackApiCall(endpoint, key);
export const getPerformanceReport = () => performanceMonitor.getPerformanceReport();
export const getPerformanceSummary = () => performanceMonitor.getPerformanceSummary();
export const logPerformanceSummary = () => performanceMonitor.logPerformanceSummary();

// Fonction pour démarrer le monitoring automatique
export const startPerformanceMonitoring = () => {
  if (process.env.NODE_ENV === 'development') {
    // Log un résumé toutes les 30 secondes
    setInterval(() => {
      performanceMonitor.logPerformanceSummary();
      performanceMonitor.cleanup();
    }, 30000);
    
    console.log('🚀 Performance monitoring started. Summary will be logged every 30 seconds.');
  }
};

export default performanceMonitor;
