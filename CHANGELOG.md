# Changelog

All notable changes to Synergia ECM Monitoring will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
