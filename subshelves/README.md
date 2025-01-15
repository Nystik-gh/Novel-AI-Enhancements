# NAIE Subshelves

NAIE Subshelves adds nested shelves to Novel AI, allowing you to create subshelves within existing shelves for better story organization.

<img src="../images/demo.gif" alt="demo" height="250">

## Features

-   Create nested subshelves within any shelf
-   Delete subshelves (safely moves contained stories to root view)
-   Move subshelves between parent shelves
-   Seamless integration with Novel AI's existing UI
-   Maintains most default Novel AI behaviors
-   Works on both desktop and mobile browsers

## Installation

[Click here to install](https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/main/subshelves/dist/naie-subshelves.user.js) after setting up a userscript manager. For detailed installation instructions, including mobile setup, see the [main README](../README.md#how-to-install).

## Technical Details

-   Parent shelf relationships are stored in shelf descriptions as metadata
-   Uses xhook (bundled) to handle metadata during fetch requests
-   Clones existing UI elements for consistent look and feel

## Potential Future Features

-   Include stories from subshelves when downloading all stories in a shelf
-   Add active shelf ID to URL for automatic navigation
-   Navigate to active story's shelf on page load
-   Better Japanese UI support
-   Respect global sorting settings for subshelves
-   Improved compact view design

## Important Notes

-   The script may stop working if the Novel AI website design or API changes.
-   If a shelf is deleted, its stories and subshelves will move to the root level, not to a parent shelf.
-   Subshelf navigation and actions are a bit slower than original functionality, this is particularly noticeable on mobile.

## Support

If you encounter any issues or have suggestions, please check the [Issues](https://github.com/Nystik-gh/Novel-AI-Enhancements/issues) section of the repository. For compatibility information, see the [main README](../README.md#compatibility).

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Disclaimer

This userscript is an independent project and is not affiliated with Novel AI. Use at your own risk.
