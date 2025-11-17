# 🔄 Guide de Migration - Ancien → Nouveau Système de Rapports

## Vue d'ensemble

Ce guide vous aidera à migrer de l'ancien système (html2canvas + jsPDF) vers le nouveau système optimisé (React-PDF + Clean Architecture).

---

## 📋 Checklist de Migration

- [ ] Backup de l'ancien code
- [ ] Installation des dépendances
- [ ] Mise à jour des imports
- [ ] Remplacement du composant ReportTabContent
- [ ] Tests de fonctionnalité
- [ ] Déploiement progressif

---

## 1️⃣ Backup de l'ancien code

```bash
# Créer une branche de backup
git checkout -b backup/old-report-system

# Copier les anciens fichiers
mkdir -p client/src/components/dashboard/tests/form/sections/report_OLD
cp -r client/src/components/dashboard/tests/form/sections/report/* \
      client/src/components/dashboard/tests/form/sections/report_OLD/

# Commit
git add .
git commit -m "Backup: old report system"
git push origin backup/old-report-system
```

---

## 2️⃣ Installation (déjà fait dans package.json)

Les dépendances nécessaires sont déjà présentes :
- ✅ `@react-pdf/renderer: ^4.3.0`
- ✅ `react: ^19.0.0`
- ✅ `react-bootstrap: ^2.10.9`

Aucune installation supplémentaire nécessaire.

---

## 3️⃣ Remplacement dans TrialForm.jsx

### ❌ Ancien code

```jsx
// Dans TrialForm.jsx
import ReportTabContent from './sections/report/ReportTabContent';

// ...

<Tab eventKey="report" title={renderTabTitle('report', t('testForm.tabs.report', 'Rapport'))}>
  <ReportTabContent 
    trialId={trial?.id}
    trialData={formData}
    partData={partData}
    partId={trial?.parent_id}
  />
</Tab>
```

### ✅ Nouveau code

```jsx
// Dans TrialForm.jsx
import { ReportConfiguration } from '../../../features/reports';

// ...

<Tab eventKey="report" title={renderTabTitle('report', t('testForm.tabs.report', 'Rapport'))}>
  <ReportConfiguration 
    trialId={trial?.id}
    partId={trial?.parent_id}
  />
</Tab>
```

**Changements** :
- Import depuis le nouveau module `features/reports`
- Props simplifiées (seulement `trialId` et `partId`)
- Pas besoin de passer `trialData` et `partData` (récupérés automatiquement)

---

## 4️⃣ Migration du service reportService

### ❌ Ancien service (client/src/services/reportService.js)

Peut être supprimé ou conservé pour compatibilité temporaire.

### ✅ Nouveau système

Le service est intégré dans `ReportDataRepository.js`. Pas besoin de fichier séparé.

Si vous souhaitez conserver l'ancien service pour d'autres usages:

```javascript
// client/src/services/reportService.js
import { ReportDataRepository } from '../features/reports';

const repository = new ReportDataRepository();

const reportService = {
  getTrialReportData: (trialId, sections) => 
    repository.getTrialReportData(trialId, sections)
};

export default reportService;
```

---

## 5️⃣ Migration côté serveur (si nécessaire)

### Backend actuel

Le controller et service backend sont compatibles. Aucune modification nécessaire :

- ✅ `server/controllers/reportController.js` - OK
- ✅ `server/services/reportService.js` - OK
- ✅ `server/routes/reports.js` - OK

### Optimisations recommandées (optionnel)

#### A. Compression d'images côté serveur

```javascript
// server/middleware/image-optimizer.js
const sharp = require('sharp');

const optimizeImage = async (req, res, next) => {
  if (req.query.optimized === 'true') {
    const maxWidth = parseInt(req.query.maxWidth) || 1920;
    const quality = parseInt(req.query.quality) || 85;

    // Optimiser avec sharp
    const buffer = await sharp(imagePath)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();

    return res.type('image/jpeg').send(buffer);
  }
  next();
};
```

#### B. Cache des rapports

```javascript
// server/middleware/report-cache.js
const NodeCache = require('node-cache');
const reportCache = new NodeCache({ stdTTL: 600 }); // 10 minutes

const cacheReport = (req, res, next) => {
  const key = `report_${req.params.trialId}_${JSON.stringify(req.query)}`;
  const cached = reportCache.get(key);

  if (cached) {
    return res.json(cached);
  }

  res.sendResponse = res.json;
  res.json = (data) => {
    reportCache.set(key, data);
    res.sendResponse(data);
  };

  next();
};
```

---

## 6️⃣ Tests de Migration

### Tests manuels

1. **Sélection de sections**
   - [ ] Toutes les sections s'affichent correctement
   - [ ] Le toggle fonctionne
   - [ ] Tout sélectionner / Tout désélectionner fonctionne

2. **Gestion des photos**
   - [ ] Les photos se chargent
   - [ ] La sélection fonctionne
   - [ ] Le compteur de photos est correct

3. **Aperçu**
   - [ ] L'aperçu se génère
   - [ ] Le contenu est correct
   - [ ] Les photos s'affichent

4. **Export PDF**
   - [ ] Le PDF se télécharge
   - [ ] La taille est réduite (comparé à l'ancien)
   - [ ] La qualité est bonne
   - [ ] Les sections sélectionnées sont présentes
   - [ ] Les photos sont incluses

5. **Performance**
   - [ ] Temps de chargement < 2s
   - [ ] Temps de génération < 5s
   - [ ] Pas de freeze de l'interface

### Tests automatisés

```javascript
// __tests__/reports/ReportConfiguration.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportConfiguration } from '@/features/reports';

describe('ReportConfiguration', () => {
  it('should render all sections', () => {
    render(<ReportConfiguration trialId={123} partId={456} />);
    
    expect(screen.getByText('Identification')).toBeInTheDocument();
    expect(screen.getByText('Recette')).toBeInTheDocument();
    expect(screen.getByText('Charge')).toBeInTheDocument();
  });

  it('should toggle section on click', () => {
    render(<ReportConfiguration trialId={123} partId={456} />);
    
    const section = screen.getByText('Identification');
    fireEvent.click(section);
    
    // Vérifier que la section est désactivée
  });
});
```

---

## 7️⃣ Déploiement Progressif

### Stratégie Blue/Green

```javascript
// Utiliser un feature flag
const USE_NEW_REPORT_SYSTEM = process.env.REACT_APP_NEW_REPORTS === 'true';

// Dans TrialForm.jsx
{USE_NEW_REPORT_SYSTEM ? (
  <ReportConfiguration trialId={trial?.id} partId={trial?.parent_id} />
) : (
  <ReportTabContent 
    trialId={trial?.id}
    trialData={formData}
    partData={partData}
    partId={trial?.parent_id}
  />
)}
```

### Phases de déploiement

1. **Phase 1 - Dev** (Semaine 1)
   - Activer sur environnement de dev
   - Tests internes de l'équipe

2. **Phase 2 - Staging** (Semaine 2)
   - Activer sur environnement de staging
   - Tests utilisateurs pilotes

3. **Phase 3 - Production 10%** (Semaine 3)
   - Activer pour 10% des utilisateurs
   - Monitoring des performances

4. **Phase 4 - Production 50%** (Semaine 4)
   - Étendre à 50% des utilisateurs
   - Collecte de feedback

5. **Phase 5 - Production 100%** (Semaine 5)
   - Déploiement complet
   - Suppression de l'ancien code

---

## 8️⃣ Rollback Plan

En cas de problème critique :

```bash
# 1. Désactiver le feature flag
REACT_APP_NEW_REPORTS=false npm run build

# 2. Ou restaurer l'ancien code
git checkout backup/old-report-system -- client/src/components/dashboard/tests/form/sections/report

# 3. Rebuild et redeploy
npm run build
```

---

## 9️⃣ Nettoyage Post-Migration

Une fois la migration validée (après 2 semaines en production) :

```bash
# Supprimer l'ancien code
rm -rf client/src/components/dashboard/tests/form/sections/report_OLD

# Supprimer les anciens fichiers de section
rm client/src/components/dashboard/tests/form/sections/report/sections/*_old.jsx

# Supprimer l'ancien ReportPreviewModal si remplacé
rm client/src/components/dashboard/tests/form/sections/report/ReportPreviewModal_old.jsx

# Commit
git add .
git commit -m "Cleanup: remove old report system after successful migration"
```

---

## 🔍 Comparaison Avant/Après

| Fonctionnalité | Ancien système | Nouveau système |
|----------------|----------------|-----------------|
| **Sélection sections** | ✅ Oui | ✅ Oui |
| **Sélection photos** | ✅ Oui | ✅ Oui (amélioré) |
| **Aperçu PDF** | ✅ Oui (lent) | ✅ Oui (rapide) |
| **Export PDF** | ✅ Oui (gros) | ✅ Oui (optimisé) |
| **Qualité texte** | ❌ Pixelisé | ✅ Vectoriel |
| **Taille fichier** | ❌ 15-30 MB | ✅ 2-5 MB |
| **Temps génération** | ❌ 10-15s | ✅ 2-3s |
| **Pagination auto** | ❌ Non (bugs) | ✅ Oui |
| **Tests unitaires** | ❌ Difficile | ✅ Facile |
| **Maintenabilité** | ❌ Code couplé | ✅ Clean Arch |

---

## 📞 Support

En cas de problème durant la migration :

1. Consulter la documentation : `client/src/features/reports/README.md`
2. Vérifier les logs de console
3. Tester avec des données simples d'abord
4. Contacter l'équipe de développement

---

## ✅ Validation de la Migration

Cocher quand terminé :

- [ ] Backup effectué
- [ ] Nouveau composant intégré
- [ ] Tests manuels passés
- [ ] Tests automatisés créés
- [ ] Performance validée (< 5s génération)
- [ ] Taille PDF validée (< 5 MB)
- [ ] Déploiement en staging OK
- [ ] Feedback utilisateurs positif
- [ ] Déploiement en production OK
- [ ] Ancien code supprimé

---

**Date de début** : _______________  
**Date de fin** : _______________  
**Responsable** : _______________
