# En-tête commune du rapport PDF

## 📋 Résumé des modifications

Une nouvelle en-tête commune a été créée pour toutes les sections du rapport PDF Trial avec un style moderne et optimisé.

## ✨ Fonctionnalités

### Nouveau composant : `CommonReportHeader`

**Emplacement** : `client/src/features/reports/infrastructure/pdf/components/CommonReportHeader.jsx`

### Structure de l'en-tête

L'en-tête contient les éléments suivants dans cet ordre hiérarchique :

#### 1. **Titre principal (H1)**
- Texte : "TRIAL REPORT"
- Style : Police 24pt, gras, rouge (#DC3545), majuscules
- Espacement des lettres augmenté pour un effet professionnel

#### 2. **Nom du client** 
- Affiché directement (sans label "Client :")
- Style : Police 16pt, gras, noir (#333333)

#### 3. **Ligne d'informations (H2)** - Load N° et Date
- Sur la même ligne
- Style : Police 14pt
- Format : `Load N°: [numéro]    Date: [date formatée]`
- Labels en gras, valeurs en régulier

#### 4. **Traitement (H3)**
- Style : Police 12pt
- Format : `Traitement: [type de processus]`

#### 5. **Logos (coin supérieur droit)**
- **Logo ECM** : 80px de largeur, en haut
- **Logo Synergy** : 60px de largeur, en dessous (temporairement logo ECM en doublon)

### Bordure

- Bordure inférieure rouge (#DC3545) de 2px
- Séparation claire entre l'en-tête et le contenu de la section

## 🎨 Style visuel

```
┌─────────────────────────────────────────────────────────────┐
│ TRIAL REPORT                                    [LOGO ECM]   │
│                                                               │
│ Nom du Client                                   [LOGO SYN]   │
│ Load N°: 12345    Date: 15 novembre 2025                     │
│ Traitement: Cémentation                                      │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Intégration

Le composant `CommonReportHeader` remplace l'ancienne `PageHeader` dans toutes les sections :

- ✅ Section Identification
- ✅ Section Micrographie
- ✅ Section Courbes
- ✅ Section Charge (Load)
- ✅ Section Recette
- ✅ Section Contrôle

## 📝 Propriétés du composant

| Propriété | Type | Description | Valeur par défaut |
|-----------|------|-------------|-------------------|
| `clientName` | string | Nom du client | `''` |
| `loadNumber` | string | Numéro de charge | `''` |
| `trialDate` | string/Date | Date de l'essai | `''` |
| `processType` | string | Type de traitement | `''` |
| `logoECMUrl` | string | URL du logo ECM | `'http://localhost:5001/images/logoECM.png'` |
| `logoSynergyUrl` | string | URL du logo Synergy | `'http://localhost:5001/images/logoECM.png'` (temporaire) |

## 🚀 Utilisation

```jsx
import { CommonReportHeader } from './components/CommonReportHeader';

<CommonReportHeader 
  clientName={report.clientName}
  loadNumber={report.trialData?.load_number}
  trialDate={report.trialData?.trial_date}
  processType={report.trialData?.process_type}
/>
```

## ⚠️ Notes

1. **Logo Synergy** : Actuellement, le logo ECM est utilisé en doublon pour le logo Synergy. 
   - À remplacer dès réception du vrai logo Synergy
   - URL à modifier dans `logoSynergyUrl`

2. **Format de date** : La date est automatiquement formatée en français long :
   - Input : `"2025-11-15"`
   - Output : `"15 novembre 2025"`

3. **Fixed positioning** : L'en-tête utilise `fixed` pour apparaître sur chaque page de la section

## 🔄 Prochaines étapes

- [ ] Remplacer le logo Synergy par le vrai logo quand il sera disponible
- [ ] Ajuster les tailles de logos si nécessaire
- [ ] Tester l'en-tête sur différentes longueurs de noms de clients
- [ ] Vérifier l'affichage dans le PDF généré

## 📁 Fichiers modifiés

1. **Nouveau fichier créé** :
   - `client/src/features/reports/infrastructure/pdf/components/CommonReportHeader.jsx`
   - `client/src/features/reports/infrastructure/pdf/components/index.js`

2. **Fichiers modifiés** :
   - `client/src/features/reports/infrastructure/pdf/ReportPDFDocument.jsx`
     - Import du nouveau composant
     - Remplacement de toutes les instances de `PageHeader` par `CommonReportHeader`
     - Adaptation des props passées
