# Changelog

All notable changes to NAIE Subshelves will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> [!Note]
> Semantic Versioning follows the pattern of `MAJOR.MINOR.PATCH`.
>
> -   **MAJOR** version increments when the update includes changes that are not backward-compatible and may cause existing subshelves to break. Even if code to migrate from an old version is included, it is still considered a breaking change and that should be considered before updating.
> -   **MINOR** version increments for new features or significant changes that are backward-compatible. If something breaks with a minor update, it is unintended and a bug.
> -   **PATCH** version increments for minor changes and bug fixes.

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

[v1.0.7]: https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/9ea64294c1b5510bbe2623fd90f65a2631df8dd0/subshelves/dist/naie-subshelves.user.js
[v1.0.6]: https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/8db1fdc374e508ffb35163ae5b98099ac15f59c8/subshelves/dist/naie-subshelves.user.js
[v1.0.5]: https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/48cf18749f5347339e5d1d60bd201683abafa916/subshelves/dist/naie-subshelves.user.js
[v1.0.4]: https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/55043744fbedc24769d39e287aa44cc8a45f6e97/subshelves/dist/naie-subshelves.user.js
[v1.0.3]: https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/54da2e70b9eb58a7d9ba9cb7bb2581a4c1739bea/subshelves/dist/naie-subshelves.user.js
