# Novel AI Enhancements

## Overview

This is a monorepo for potentially multiple userscripts to enhance the functionality of the Novel AI website.

## Table of Contents

-   [NAIE Subshelves](#naie-subshelves)
-   [How to Install](#how-to-install)
-   [Mobile Installation (Android)](#mobile-installation-android)
    -   [Firefox Nightly with Violentmonkey](#firefox-nightly-with-violentmonkey)
    -   [Firefox for Android with Tampermonkey](#firefox-for-android-with-tampermonkey)
-   [Key Features](#key-features)
-   [How It Works](#how-it-works)
-   [Dependencies](#dependency)
-   [Potential Future Features](#potential-future-features)
-   [Important Notes](#important-notes)
-   [Compatibility](#compatibility)
-   [Mobile Compatibility](#mobile-compatibility)
    -   [Android Compatibility](#android-compatibility)
    -   [iOS Compatibility](#ios-compatibility)
-   [Reporting Compatibility Issues](#reporting-compatibility-issues)
-   [Feedback](#feedback)
-   [License](#license)
-   [Disclaimer](#disclaimer)

## NAIE Subshelves

NAIE Subshelves adds nested shelves to Novel AI, allowing users to create subshelves within existing shelves. This feature helps organize stories more effectively.

<img src="images/demo.gif" alt="demo" height="250">

## How to Install

1. First, install a userscript extension for your browser:

    - [Violentmonkey](https://violentmonkey.github.io/) (Open source)
    - [Tampermonkey](https://www.tampermonkey.net/) (Closed source)

2. After installing the userscript extension, click on this link to install the NAIE Subshelves script: [Install NAIE Subshelves](https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/main/subshelves/dist/naie-subshelves.user.js)

3. Your userscript extension should prompt you to install the script. Click "Install" or "OK" to proceed.

4. Refresh your Novel AI page, and the NAIE Subshelves features should now be available.

## Mobile Installation (Android)

Note: For information about iOS support, please refer to the [iOS Compatibility](#ios-compatibility) section below.

### Firefox Nightly with Violentmonkey

1. Install [Firefox Nightly](https://play.google.com/store/apps/details?id=org.mozilla.fenix) from the Google Play Store.

2. In Firefox Nightly, navigate to the [Violentmonkey Add-on page](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/).

3. Tap "Add to Firefox" and then "Add" in the confirmation popup.

4. Once Violentmonkey is installed, follow steps 2-4 from the desktop installation instructions above.

### Firefox for Android with Tampermonkey

1. Install [Firefox for Android](https://play.google.com/store/apps/details?id=org.mozilla.firefox) from the Google Play Store.

2. In Firefox for Android, tap the menu button and select "Add-ons".

3. From the limited options available, select and install Tampermonkey.

4. Once Tampermonkey is installed, follow steps 2-4 from the desktop installation instructions above.

## Key Features

-   Create subshelves within shelves
-   Delete subshelves
-   Move subshelves

## How It Works

-   The script is made to integrate as seamlessly as possible with the existing platform, cloning existing UI elements.
-   Parent shelf IDs are stored in the shelf description as metadata.
-   Most default Novel AI behaviors are maintained.

## Dependencies

This script has one dependency (bundled with the script):

-   xhook: Used for hooking into fetch requests, which is necessary to handle metadata when loading and saving.

## Potential Future Features

The following features may be implemented at some point in no particular order:

-   Including stories from subshelves when downloading all stories in a shelf
-   Adding active shelf ID to url for automatic navigation on page load
-   Automatic navigation to the active story's shelf on page load
-   Better support for Japanese UI
-   Make subshelves respect sorting setting (currently subshelves are sorted alphabetically)
-   Improve design for compact view

## Important Notes

-   The script may stop working if the Novel AI website design changes.
-   If a shelf is deleted, its stories and subshelves will move to the root level, not to a parent shelf.
-   Subshelf navigation and actions are a bit slower than original functionality, this is particularly noticeable on mobile.

## Compatibility

The script has been tested and confirmed to work on:

-   Tampermonkey for Chrome
-   Violentmonkey for Chrome
-   Violentmonkey for Firefox

Note: Greasemonkey is not currently supported. The script does not work on Greasemonkey, and I have very little interest in figuring out why. If you're a Greasemonkey user and want to make it work, you're welcome to investigate and contribute fixes.

## Mobile Compatibility

Please note that mobile performance may be slower compared to desktop, particularly when dealing with large numbers of shelves and subshelves.

### Android Compatibility

The script has been tested and confirmed to work on:

-   Firefox Nightly with Violentmonkey
-   Firefox for Android with Tampermonkey

### iOS Compatibility

It is possible to run userscripts on iOS using a Safari extension. For more information on how to set this up, you can refer to the [iOS Userscripts project on GitHub](https://github.com/quoid/userscripts). It could also possibly work with [Orion Browser](https://apps.apple.com/us/app/orion-browser-by-kagi/id14844982000) with Violentmonkey.

However, I do not have an iOS device and so cannot test either if these solutions. If you successfully run the script on iOS, please consider sharing your experience to help other users.

## Reporting Compatibility Issues

If you encounter any compatibility issues with the supported browsers and userscript extensions, or if you successfully use the script with other setups, please report your findings in the project's issue tracker. This will help improve compatibility information for all users.

## Feedback

Feedback and bug reports are welcome. Please open an issue on Github.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Disclaimer

This userscript is an independent project developed by a single individual and is not affiliated with, endorsed by, or in any way officially connected to Novel AI or its developers.

Further development of this project depends on the developer's available time and motivation. Use this userscript at your own risk.
