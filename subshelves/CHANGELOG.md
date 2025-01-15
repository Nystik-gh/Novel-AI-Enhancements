# Changelog

All notable changes to NAIE Subshelves will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and loosely follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> [!IMPORTANT]
> Version numbers follow the pattern of `MAJOR.MINOR.PATCH`, but with some adaptations for end-user scripts:
>
> -   **MAJOR** version increments indicate significant changes to functionality or architecture, not necessarily breaking changes. Since feature scripts don't expose an API, major versions may be bumped for substantial updates that change how the script operates internally.
> -   **MINOR** version increments for new features and enhancements.
> -   **PATCH** version increments for bug fixes and minor improvements.

## [v2.0.4] - 2025-01-15

### Changed

-   Major architectural refactor: Split the script into core and feature components
-   Moved common functionality into a shared core script
-   Improved code organization and maintainability
-   Updated dependency management
-   Fixed various code style inconsistencies

## [v1.0.7] - 2024-07-23

### Fixed

-   Fixed script not loading when story list is empty

## [v1.0.6] - 2024-07-19

### Fixed

-   Fixed a bug that allowed multiple context menus to be shown at the same time.
-   Fixed a bug causing the sidebar lock to be unlocked too early.

## [v1.0.5] - 2024-07-18

### Fixed

-   Fixed a bug affecting browsers that use `webkit-mask-image` over `mask-image`.

## [v1.0.4] - 2024-07-18

### Fixed

-   Fixed a bug where the home shelf would not populate more stories on scroll if a certain amount of subshelves were created.

## [v1.0.3] - 2024-07-16

### Fixed

-   Fixed issue in contextmenu setup

[v2.0.4]: https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/<commitid>/subshelves/dist/naie-subshelves.user.js
[v1.0.7]: https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/9ea64294c1b5510bbe2623fd90f65a2631df8dd0/subshelves/dist/naie-subshelves.user.js
[v1.0.6]: https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/8db1fdc374e508ffb35163ae5b98099ac15f59c8/subshelves/dist/naie-subshelves.user.js
[v1.0.5]: https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/48cf18749f5347339e5d1d60bd201683abafa916/subshelves/dist/naie-subshelves.user.js
[v1.0.4]: https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/55043744fbedc24769d39e287aa44cc8a45f6e97/subshelves/dist/naie-subshelves.user.js
[v1.0.3]: https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/54da2e70b9eb58a7d9ba9cb7bb2581a4c1739bea/subshelves/dist/naie-subshelves.user.js
