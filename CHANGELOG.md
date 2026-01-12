# Changelog

All notable changes to Synergia ECM Monitoring will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.8] - 2026-01-12

### Fixed - File Upload Physical Path Resolution

- **Docker volume mount fix for development**
  - Added `/app/uploads` exclusion in `docker-compose.dev.yml` to prevent bind mount from overwriting the uploads volume
  - This ensures uploaded files persist correctly in the Docker volume

- **Improved file path resolution logging**
  - Enhanced `getFileById` and `downloadFile` in `fileService.js` with detailed logging
  - Logs now include `UPLOAD_BASE_DIR`, `storage_key`, and `file_path` for easier debugging

- **Added explicit `datapaq` mapping**
  - Added `'datapaq': 'datapaq'` to `FileMetadataService.js` normalizeFileType mapping

### Added

- **File upload diagnostic script**: `server/scripts/diagnose-file-uploads.js`
  - Checks file existence for all uploaded files
  - Verifies storage_key vs file_path consistency
  - Identifies orphaned temp files
  - Usage: `node scripts/diagnose-file-uploads.js --category=datapaq`

## [1.2.7] - 2026-01-09

### Fixed - Critical File Upload Path Consistency

- **Unified UPLOAD_BASE_DIR across all server modules**
  - `FileStorageService.js`: Now imports from `utils/fileStorage.js` instead of using `process.env.UPLOAD_BASE_DIR`
  - `parse-and-resolve.js`: Uses centralized `UPLOAD_BASE_DIR` constant
  - `file-path.js`: Uses centralized `UPLOAD_BASE_DIR` constant
  - `fileUtils.js`: Uses centralized `UPLOAD_BASE_DIR` constant
  - `startup/routes.js`: Uses centralized `UPLOAD_BASE_DIR` constant

- **Root cause**: In production (Docker), different modules used different path sources:
  - Some used `process.env.UPLOAD_BASE_DIR` (undefined in docker-compose.prod.yml)
  - Some used `path.join(__dirname, '../uploads')` (resolved to container path)
  - This caused "Fichier physique introuvable" error for DatapaqSection uploads

## [Unreleased]

### Changed - Phase 2 Architecture Improvements (Task 2.1: GenericEntityList Migration)

- **Completed migration of all entity lists to GenericEntityList pattern**
  - Migrated `TrialRequestList` (OrderList): 359 lines → 75 lines (**79% reduction**, -284 lines)
  - Migrated `PartList`: 364 lines → 96 lines (**74% reduction**, -268 lines)
  - Migrated `TrialList`: 373 lines → 153 lines (**59% reduction**, -220 lines)
  - Previously migrated: `ClientList` (76% reduction, -272 lines) and `SteelList` (67% reduction, -398 lines)

- **Total code reduction across 5 entity lists: ~1,442 lines eliminated (68% average reduction)**
  - Before: 2,043 lines of duplicated list code
  - After: 601 lines (includes 528-line reusable GenericEntityList)
  - Net reduction considering GenericEntityList: ~913 lines (45% overall reduction)

### Added - GenericEntityList Enhancements

- **New props for enhanced flexibility**
  - `formProps`: Pass custom props to form components (e.g., `clientId`, `orderId`, `partId`)
  - `contextDisplay`: Display parent entity name in header (e.g., "Orders - ClientName")
  - `customFormWrapper`: Support for custom modal wrappers (TrialFormWithSideNavigation)

- **Hierarchical navigation improvements**
  - Automatic back button in hierarchical mode (`useHierarchyMode={true}`)
  - Context display for parent entity names
  - Preserved all navigation logic and status updates

- **Auto-open functionality preserved in TrialList**
  - SessionStorage-based trial opening from global search
  - Modal handlers exposed via columns function
  - Seamless integration with GenericEntityList lifecycle

### Improved - Code Quality & Maintainability

- **DRY principle enforced**: Centralized list logic in single reusable component
- **Single point of maintenance**: Bug fixes and features now apply to all lists automatically
- **Consistent UX**: All lists share identical behavior for modals, search, sorting, pagination
- **Type safety**: Enhanced PropTypes with new configuration options
- **Testability**: One component to test instead of five

### Technical Details

- GenericEntityList now supports both standard Modal-based forms and custom wrapper components
- Column helpers (`createClickableNameColumn`, `createTextColumn`, `createDateColumn`) used consistently
- Preserved all entity-specific logic (steel composite display, trial auto-open, delete modals)
- All lists maintain backward compatibility with existing forms and services

---

## [1.2.1] - 2025-12-23

### Added
- New `selectHelpers.js` utility module for enhanced react-select components
  - Custom filtering with relevance-based sorting (exact match → starts with → contains)
  - Smart option validation preventing exact duplicates while allowing similar values (e.g., "HV" and "HV2")
  - Improved user experience when searching and creating options in dropdowns

### Changed
- Enhanced form selection handling across Part, Steel, and Trial forms
  - Fixed automatic steel selection after creation in PartForm (proper node_id handling)
  - Integrated selectHelpers in BasicInfoSection, DimensionsSection, SpecificationsSection, and SteelSection
  - Updated EnumTableContent, FurnacesSection, ResultsDataSection, FurnaceDataSection, and TrialTypeSection with improved select behavior

- Increased file upload capacity and timeout limits
  - Raised Express body parser limit from default to 50MB
  - Configured Nginx `client_max_body_size` to 50MB
  - Added extended timeouts (300s) for proxy read/connect/send operations
  - Applied configuration in both nginx/conf/default.conf and deploy.sh

### Improved
- Form hooks (useFormState, usePartData, usePartSubmission) updated for better integration with selectHelpers
- Better handling of CreatableSelect components across all forms
- More intuitive dropdown search experience with smart filtering and sorting

### Infrastructure
- Updated deployment configuration for larger file handling
- Synchronized nginx configuration between development and production environments

---

## [1.2.0] - 2024-XX-XX

### Added
- Recipe chemical cycle fields: `wait_gas` and `wait_flow` for gas/flow waiting times

### Fixed
- Report generation: section ordering and loading UI improvements
- Thermal cycle visualization with SVG arrows

### Improved
- Report PDF generation enhancements

---

## [1.1.0] - 2024-XX-XX

### Added
- Initial production-ready release
- Client → Order → Part → Trial hierarchy
- PDF report generation with signatures and QR codes
- File upload and management system
- User authentication with JWT
- Docker deployment with Nginx reverse proxy
- Advanced search functionality
- Multi-language support (French/English)

### Infrastructure
- MySQL 8.0 database
- React 19 frontend
- Node.js/Express backend
- Sequelize ORM
- Docker Compose deployment
