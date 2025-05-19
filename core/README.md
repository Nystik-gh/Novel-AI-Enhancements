# NAIE Core

NAIE Core is the foundation script for Novel AI Enhancements, providing essential functionality and a stable API for feature scripts.

## Features

-   Scripts management system for handling script registration and lifecycle
-   Common utilities and shared functionality
-   Request interception and modification via xhook
-   Stable API for feature script integration

## Technical Details

### Architecture

The core script serves as the foundation for all NAIE feature scripts, providing:

-   Centralized script management
-   Shared utilities and helper functions
-   Request interception and modification capabilities
-   Consistent API for feature script integration

### Dependencies

-   [xhook](https://github.com/jpillora/xhook) - Used for intercepting and modifying XHR/fetch requests
    -   Bundled with the core script (includes custom patches for improved compatibility)
    -   Each feature script shares the same xhook instance

### API Documentation

Feature scripts interact with the core through a stable API that follows semantic versioning. Breaking changes will only occur with major version increments.

[📚 View Full API Documentation](https://nystik-gh.github.io/Novel-AI-Enhancements/)

Key API features:

-   Script registration and lifecycle management
-   Access to shared utilities
-   Request interception capabilities
-   Event system for cross-script communication

## API Reference

The NAIE core provides a global `NAIE_INSTANCE` object that exposes the following namespaces:

### Core Namespaces

-   `NETWORK` - Network request interception and modification utilities
-   `MISC` - General utility functions
-   `DOM` - DOM manipulation and observation utilities
-   `NAI` - Novel AI specific utilities and helpers
-   `EXTENSIONS` - Extension management and registration
-   `LOGGING` - Logging and debugging utilities
-   `PREFLIGHT` - Script initialization and dependency checks
-   `CORE` - Core functionality and script management
-   `SERVICES` - Shared services (status indicators, modal observers)

### Services

The `SERVICES` namespace provides access to shared singleton services:

-   `statusIndicator` - Display messages and notifications
-   `modalObserver` - Detect and interact with NAI modals

### Script Initialization Example

```javascript
// ==UserScript==
// @name         My Feature Script
// @require      https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/main/core/dist/naie-core.user.js
// @run-at       document-start
// ==/UserScript==
'use strict'

let scriptInit = false

const wRef = unsafeWindow ? unsafeWindow : window

/** @type {NAIE} */
let NAIE = wRef.NAIE_INSTANCE

const init = () => {
    // If the script needs to intercept requests at page load,
    // network hooks should be registered as early as possible
    NAIE.NETWORK.registerHook({
        id: 'my-feature-hook',
        urlPattern: '/api/endpoint',
        methods: ['POST'],
        priority: 10,
        modifyRequest: async (request) => {
            // Get request options and parse body
            const options = NAIE.NETWORK.getFetchOptions(request)
            const body = JSON.parse(options.body)

            // You can either modify the request and let it continue
            body.metadata = {
                ...body.metadata,
                modified: true,
                timestamp: Date.now(),
            }
            options.body = JSON.stringify(body)

            return {
                type: 'request',
                value: new Request(request.url, options),
            }

            // Or return a response directly to prevent the request
            // return {
            //     type: 'response',
            //     value: new Response('{}', {
            //         status: 418,
            //         statusText: 'Request intercepted'
            //     })
            // }
        },
        modifyResponse: async (response, request) => {
            // Clone response to avoid consuming it
            const copy = response.clone()
            const data = await copy.json()

            // Modify the response data
            const modified = {
                ...data,
                processed: true,
                processingTime: Date.now(),
            }

            // Return new response with modified data
            return new Response(JSON.stringify(modified), {
                status: response.status,
                headers: response.headers,
            })
        },
    })

    document.addEventListener('DOMContentLoaded', async () => {
        if (!scriptInit) {
            try {
                // Initialize your feature here
                NAIE.CORE.registerScript('my-feature-script')

                // Register preflight hooks for initialization stages
                NAIE.PREFLIGHT.registerHook('main', 'my-feature-core', 10, async () => {
                    // Wait for required DOM elements
                    await NAIE.DOM.waitForElement('#my-element')
                    // Initialize core functionality
                })

                NAIE.PREFLIGHT.registerHook('late', 'my-feature-final', 10, async () => {
                    // Final setup after core initialization
                    NAIE.SERVICES.statusIndicator.displayMessage('Feature initialized!')
                })

                // When all scripts are ready core will run preflight
                NAIE.CORE.markScriptReady('my-feature-script')
                scriptInit = true
            } catch (e) {
                NAIE.LOGGING.getLogger().error(e)
                alert('Failed to initialize feature script.\n\nDisable the script and report the issue.')
            }
        }
    })
}

// Only initialize on the stories page
if (wRef.location.pathname.startsWith('/stories')) {
    scriptInit = false
    init()
}
```

### Requirements

Feature scripts must:

1. Declare core as a dependency:

```javascript
// @require https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/main/core/dist/naie-core.user.js
```

2. Access the NAIE instance through the global window object
3. Initialize only after core is ready

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
