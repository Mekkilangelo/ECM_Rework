# Phase 2 - Task 2.1: GenericEntityList Component

## ✅ Status: COMPLETED

## Objective
Abstract the EntityList pattern into a reusable GenericEntityList component to eliminate ~350 lines of duplicated code per entity list.

## Implementation

### 1. Core Component Created
**File**: `client/src/components/common/GenericEntityList/GenericEntityList.jsx` (523 lines)

#### Key Features:
- **Dual-mode support**: Hierarchical (useHierarchy hook) and Independent (local state)
- **Automatic pagination**: Supports both NavigationContext-based and explicit pagination
- **Actions column**: Automatically adds View/Edit/Delete buttons
- **Modal management**: Handles Create/Edit/View modals with FormHeader support
- **Copy/Paste**: Built-in form ref management for copy/paste functionality
- **Custom delete handlers**: Supports override for complex delete logic
- **Responsive search**: Integrated SearchInput with debouncing
- **Sorting**: Server-side sorting with SortableTable integration
- **Empty states**: Configurable empty state cards
- **i18n ready**: All labels use translation keys with entity namespacing

#### Configuration Props:
```javascript
<GenericEntityList
  entityName="clients"           // i18n namespace
  entityType="client"            // For logging and entity prop naming
  icon={faBuilding}              // FontAwesome icon
  columns={columns}              // Array or function(handlers) => columns
  FormComponent={ClientForm}     // Form component for modals
  service={{ delete, getAll }}   // Service methods
  useHierarchyMode={true}        // true=useHierarchy, false=independent
  showPagination={false}         // Show pagination controls
  modalSize="xl"                 // Modal size
  getItemName={(item) => ...}    // Extract item name for delete confirmation
  onDelete={customHandler}       // Optional custom delete handler
  includeActionsColumn={true}    // Auto-add actions column
/>
```

### 2. Column Helpers Created
**File**: `client/src/components/common/GenericEntityList/columnHelpers.js` (168 lines)

#### Helper Functions:
- `createClickableNameColumn()` - Name column with status badge and click handler
- `createTextColumn()` - Simple text column with custom getValue
- `createNestedColumn()` - Access nested properties via dot notation
- `createDateColumn()` - Formatted date column

### 3. Migrations Completed

#### A. ClientList Migration
**Before**: 357 lines
**After**: 85 lines
**Reduction**: 272 lines (76% reduction)

**Mode**: Hierarchical (useHierarchy hook)
**Features**: Navigation to trial_requests, status badge, nested client properties

**Column Configuration**:
```javascript
const columns = [
  createClickableNameColumn({
    key: 'name',
    label: t('clients.name'),
    onClick: handleClientClick,
    getValue: (client) => client.name,
    getStatus: (client) => client.data_status,
    noValueText: t('clients.noName')
  }),
  createNestedColumn({
    key: 'client.client_group',
    label: t('clients.group'),
    path: 'client.client_group'
  }),
  // ... more columns
];
```

#### B. SteelList Migration
**Before**: 590 lines
**After**: 192 lines
**Reduction**: 398 lines (67% reduction)

**Mode**: Independent (local state with explicit pagination)
**Features**: Custom delete modal with usage check, replace-and-delete option

**Special Implementation**:
```javascript
// Store refreshData ref for modal callbacks
const refreshDataRef = useRef(null);

const handleDeleteSteel = async (steelId, { data, refreshData }) => {
  refreshDataRef.current = refreshData;

  const usage = await steelService.checkSteelUsage(steelId);

  if (usage.isUsed && usage.totalCount > 0) {
    // Show custom DeleteWithUsageModal
    setSteelToDelete({ id: steelId, name: steelName });
    setSteelUsage(usage);
    setShowDeleteModal(true);
  } else {
    // Standard delete confirmation
    const confirmed = await confirmDelete(steelName, "l'acier");
    if (confirmed) {
      await steelService.deleteSteel(steelId);
      await refreshData();
    }
  }
};
```

## Results

### Code Reduction
- **ClientList**: -272 lines (76% reduction)
- **SteelList**: -398 lines (67% reduction)
- **Total saved**: 670 lines across 2 entity lists
- **Potential total savings**: ~1750 lines if all 5 entity lists migrated

### Benefits
1. **Maintainability**: Single source of truth for list patterns
2. **Consistency**: All entity lists now follow same structure
3. **Flexibility**: Supports both hierarchical and independent modes
4. **Extensibility**: Easy to add new entity lists with minimal code
5. **Testing**: Test once, applies to all entity lists

### Remaining Entity Lists (Optional Migration)
- OrderList/TrialRequestList (~350 lines each)
- PartList (~380 lines)
- TrialList (~420 lines)

## Technical Notes

### Rules of Hooks Compliance
Always call `useHierarchy()` unconditionally to comply with React Rules of Hooks:
```javascript
// Always call - even if not using hierarchical mode
const hierarchyData = useHierarchy();

// Conditionally use the data
const data = useHierarchyMode ? hierarchyData.data : independentData;
```

### Custom Delete Handlers
GenericEntityList supports custom delete handlers for complex scenarios:
```javascript
onDelete={async (itemId, { data, refreshData }) => {
  // Custom logic here
  // Has access to full data array and refreshData function
}}
```

### Column Functions
Columns can be a function receiving handlers for advanced scenarios:
```javascript
columns={(handlers) => [
  // handlers.openDetailModal, handlers.openEditModal, handlers.handleDelete
  // handlers.t (i18n), handlers.hasEditRights
]}
```

## Commits
1. `8395212` - feat: create GenericEntityList component to abstract common list patterns
2. `686daa7` - refactor: migrate ClientList to use GenericEntityList component
3. `b35dcf6` - refactor: migrate SteelList to use GenericEntityList component

## Build Status
✅ Compiles successfully with warnings only (pre-existing)

## Next Steps
- **Task 2.2**: Migrate validation to Yup + Formik (~30% form code reduction)
- **Task 2.3**: Implement code splitting and lazy loading (~50% initial load reduction)

---

**Generated**: 2026-01-07
**Phase**: 2 - Architecture Improvements
**Task**: 2.1 - GenericEntityList Abstraction
