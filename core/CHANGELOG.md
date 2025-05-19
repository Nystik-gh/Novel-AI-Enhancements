# Changelog

All notable changes to NAIE Core will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> [!IMPORTANT]
>
> -   **MAJOR** version increments when making incompatible API changes
> -   **MINOR** version increments when adding functionality in a backwards compatible manner
> -   **PATCH** version increments when making backwards compatible bug fixes

## [v1.1.0] - 2025-05-19

### Changed

-   Major: Switched to a fully custom select control template instead of cloning from settings, improving initialization robustness and future-proofing against UI changes.

### Fixed

-   Minor: Ensure use of `wRef` instead of `window` for all window references to improve compatibility and avoid global scope issues.

[v1.1.0]: https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/35c03bda9294d7ccd1e4ae66d8131b0a753fbba4/core/dist/naie-core.user.js

## [v1.0.4] - 2025-01-15

### Added

-   Initial release of the core script
-   Scripts manager for handling script registration and lifecycle
-   Common utilities and shared functionality for NAIE scripts
-   Public API for script integration and management

[v1.0.4]: https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/423c37e83b07b0f242fa211fe036fbbfe081dd9d/core/dist/naie-core.user.js
