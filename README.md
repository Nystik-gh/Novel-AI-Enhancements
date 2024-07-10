# Novel AI Enhancements

## Overview

This is a monorepo for potentially multiple userscripts to enhance the functionality of the Novel AI website.

## NAIE Subshelves

### What It Does

NAIE Subshelves adds nested shelves to Novel AI, allowing users to create subshelves within existing shelves. This feature helps organize stories more effectively.

### Key Features

-   Create subshelves within shelves
-   Delete subshelves
-   Move subshelves

### How It Works

-   The script is made to integrate as seemlessly as possible with the existing platform.
-   Parent shelf IDs are stored in the shelf description as metadata.
-   Most default Novel AI behaviors are maintained.

### Dependency

This script has one dependency:

-   xhook: Used for hooking into fetch requests, which is necessary to handle metadata when loading and saving.

### Potential Future Features

The following features may be implemented at some point:

-   Including stories from subshelves when downloading all stories in a shelf
-   Adding active shelf ID to url for automatic navigation on page load
-   Automatic navigation to the active story's shelf on page load

### Important Notes

-   The script may stop working if the Novel AI website design changes.
-   If a shelf is deleted, its stories and subshelves will move to the root level, not to a parent shelf.

## Feedback

Feedback and bug reports are welcome. Please open an issue on Gitlab.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Disclaimer

This is an independent project by a single developer. Further development depends on available time and motivation. Use at your own risk.
