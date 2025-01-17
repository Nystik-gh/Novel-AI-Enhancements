/**
 * Base URL for the NovelAI API
 */
const API_BASE_URL = 'https://api.novelai.net'

/**
 * Creates a network manager for intercepting and modifying requests
 *
 * @returns {NetworkManager} The network manager instance
 */
const network_createNetworkManager = () => {
    const hooks = []
    const nativeFetch = xhook.fetch.bind(window)

    /**
     * Gets the matching hooks for a given URL and method
     *
     * @param {RequestHook[]} hooks - The list of hooks
     * @param {string} url - The URL of the request
     * @param {string} method - The method of the request
     * @returns {RequestHook[]} The matching hooks
     */
    const getMatchingHooks = (hooks, url, method) => {
        // Skip data URLs and requests without methods
        if (!method || url.startsWith('data:')) {
            return []
        }

        return hooks.filter(
            (hook) =>
                hook.enabled &&
                (hook.methods.length === 0 || hook.methods.includes(method.toUpperCase())) &&
                (typeof hook.urlPattern === 'string' ? url.startsWith(API_BASE_URL + hook.urlPattern) : hook.urlPattern.test(url)),
        )
    }

    /**
     * Processes a request by chaining modifications from matching hooks
     *
     * @param {RequestHook[]} hooks - The list of hooks
     * @param {function} nativeFetch - The native fetch function
     * @returns {function} The request processing function
     */
    const processRequest = (hooks, nativeFetch) => async (request) => {
        // Skip data URLs and requests without methods
        if (!request.method || request.url.startsWith('data:')) {
            return nativeFetch(request.url, request)
        }
        console.log('processRequest', request.url, request.method)
        const matchingHooks = getMatchingHooks(hooks, request.url, request.method)

        // Chain request modifications
        let modifiedRequest = request
        for (const hook of matchingHooks) {
            if (hook.modifyRequest) {
                const result = await hook.modifyRequest(modifiedRequest)
                // If the hook returns a Response directly, return it without making the request
                if (result.type === 'response') {
                    return result.value
                }
                // Otherwise, use the modified request
                modifiedRequest = result.value
            }
        }

        // Make the actual request
        const response = await nativeFetch(modifiedRequest.url, modifiedRequest)

        // Chain response modifications
        let modifiedResponse = response
        for (const hook of matchingHooks) {
            if (hook.modifyResponse) {
                modifiedResponse = await hook.modifyResponse(modifiedResponse, request)
            }
        }

        return modifiedResponse
    }

    let preflightResolver
    const internalPreflightPromise = new Promise((resolve) => {
        preflightResolver = resolve
    })

    const markPreflightComplete = () => {
        preflightResolver()
    }

    const initialize = () => {
        console.log('initialize xhook')
        xhook.before((request, callback) => {
            console.log('xhook before')

            // Wait for internal preflight to complete
            console.log('waiting for internal preflight, deferring request')
            internalPreflightPromise.then(() => {
                console.log('internal preflight complete')

                processRequest(
                    hooks,
                    nativeFetch,
                )(request)
                    .then(callback)
                    .catch((error) => {
                        LOGGING_UTILS.getLogger().error('Hook processing error:', error)
                        nativeFetch(request.url, request).then(callback)
                    })
            })
        })
    }

    return {
        /**
         * Registers a hook with the network manager
         *
         * @param {RequestHook} hook - The hook to register
         */
        registerHook: (hook) => {
            hooks.push({ ...hook, enabled: true })
            hooks.sort((a, b) => b.priority - a.priority)
        },
        /**
         * Unregisters a hook with the network manager
         *
         * @param {string} id - The ID of the hook to unregister
         */
        unregisterHook: (id) => {
            const index = hooks.findIndex((h) => h.id === id)
            if (index !== -1) hooks.splice(index, 1)
        },
        /**
         * Enables a hook with the network manager
         *
         * @param {string} id - The ID of the hook to enable
         */
        enableHook: (id) => {
            const hook = hooks.find((h) => h.id === id)
            if (hook) hook.enabled = true
        },
        /**
         * Disables a hook with the network manager
         *
         * @param {string} id - The ID of the hook to disable
         */
        disableHook: (id) => {
            const hook = hooks.find((h) => h.id === id)
            if (hook) hook.enabled = false
        },
        initialize,
        markPreflightComplete,
        API_BASE_URL,
    }
}
