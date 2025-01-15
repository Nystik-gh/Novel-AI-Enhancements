# Novel AI Enhancements

## Overview

NAIE is a suite of userscripts designed to enhance the functionality of the Novel AI website. The enhancements are modular, with feature-specific scripts that integrate seamlessly with the platform.

## Table of Contents

-   [Feature Scripts](#feature-scripts)
-   [How to Install](#how-to-install)
-   [Mobile Installation (Android)](#mobile-installation-android)
    -   [Firefox Nightly with Violentmonkey](#firefox-nightly-with-violentmonkey)
    -   [Firefox for Android with Tampermonkey](#firefox-for-android-with-tampermonkey)
-   [Dependencies](#dependencies)
-   [Important Notes](#important-notes)
-   [Compatibility](#compatibility)
-   [Mobile Compatibility](#mobile-compatibility)
    -   [Android Compatibility](#android-compatibility)
    -   [iOS Compatibility](#ios-compatibility)
-   [Reporting Compatibility Issues](#reporting-compatibility-issues)
-   [Feedback](#feedback)
-   [License](#license)
-   [Disclaimer](#disclaimer)

## Feature Scripts

This repository includes the following feature scripts:

-   **[NAIE Subshelves](subshelves/README.md)** - Adds the ability to organize stories using nested shelves. Refer to its README for details on functionality, installation, and usage.

More feature scripts may be added over time.

## How to Install

1. Install a userscript extension for your browser:

    - [Violentmonkey](https://violentmonkey.github.io/) (Open source)
    - [Tampermonkey](https://www.tampermonkey.net/) (Closed source)

2. Follow the installation instructions in the README of your chosen feature script.

3. Refresh the Novel AI page after installation to activate the feature.

## Mobile Installation (Android)

> [!Note]
> For information about iOS support, please refer to the [iOS Compatibility](#ios-compatibility) section below.

### Firefox Nightly with Violentmonkey

1. Install [Firefox Nightly](https://play.google.com/store/apps/details?id=org.mozilla.fenix) from the Google Play Store.
2. Navigate to the [Violentmonkey Add-on page](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/) and tap "Add to Firefox."
3. Follow the installation instructions for your chosen feature script.

### Firefox for Android with Tampermonkey

1. Install [Firefox for Android](https://play.google.com/store/apps/details?id=org.mozilla.firefox) from the Google Play Store.
2. Use the browser menu to install Tampermonkey from the limited add-on options.
3. Follow the installation instructions for your chosen feature script.

## Dependencies

This suite has one dependency (bundled with the core script):

-   xhook: Used for hooking into fetch requests, which is necessary to handle metadata when loading and saving.

## Important Notes

-   The scripts may stop working if the Novel AI website design or API changes.

## Compatibility

The script has been tested and confirmed to work on:

-   Tampermonkey for Chrome
-   Violentmonkey for Chrome
-   Violentmonkey for Firefox

> [!Note]
> Greasemonkey is not currently supported. The script does not work on Greasemonkey, and I have very little interest in figuring out why. If you're a Greasemonkey user and want to make it work, you're welcome to investigate and contribute fixes.

## Mobile Compatibility

### Android Compatibility

The script has been tested and confirmed to work on:

-   Firefox Nightly with Violentmonkey
-   Firefox for Android with Tampermonkey

### iOS Compatibility

It is possible to run userscripts on iOS using a Safari extension. For more information on how to set this up, you can refer to the [iOS Userscripts project on GitHub](https://github.com/quoid/userscripts). It could also possibly work with [Orion Browser](https://apps.apple.com/us/app/orion-browser-by-kagi/id14844982000) with Violentmonkey.

However, I do not have an iOS device and so cannot test either of these solutions. If you successfully run the script on iOS, please consider sharing your experience to help other users.

## Reporting Compatibility Issues

If you encounter any compatibility issues with the supported browsers and userscript extensions, or if you successfully use the script with other setups, please report your findings in the project's issue tracker. This will help improve compatibility information for all users.

## Feedback

Feedback and bug reports are welcome. Please open an issue on GitHub.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Disclaimer

This userscript suite is an independent project developed by a single individual and is not affiliated with, endorsed by, or in any way officially connected to Novel AI or its developers.

Further development of this project depends on the developer's available time and motivation. Use this userscript at your own risk.
