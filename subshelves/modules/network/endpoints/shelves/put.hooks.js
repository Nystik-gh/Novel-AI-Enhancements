/**
 * Hooks for handling PUT requests to the shelves API endpoint
 */

// Track active PUT requests to handle double-PUT pattern
const activePutShelfRequests = new Map()

/**
 * Register hooks for PUT operations on the shelves endpoint
 */
const registerShelfPutHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'shelf-put',
        priority: 10,
        urlPattern: '/user/objects/shelf',
        methods: ['PUT'],
        modifyRequest: async (request) => {
            const options = NAIE.NETWORK.getFetchOptions(request)
            const body = JSON.parse(options.body)
            const data = JSON.parse(NAIE.MISC.decodeBase64(body.data))
            const shelf_id = body.meta

            // Handle first PUT request
            if (!activePutShelfRequests.has(shelf_id)) {
                activePutShelfRequests.set(shelf_id, 1)
                processNewShelf(shelf_id) // This will trigger a new PUT request
                return {
                    type: 'response',
                    value: new Response('{}', {
                        status: 418,
                        statusText: 'Blocked by client',
                    }),
                }
            }

            // Process second PUT request (the one triggered by processNewShelf)
            data.description = stripTransientMetadataFromText(data.description)
            body.data = NAIE.MISC.encodeBase64(JSON.stringify(data))
            options.body = JSON.stringify(body)

            if (shelfState) {
                try {
                    shelfState.upsertShelf(shelf_id, decodeShelf(body))
                } catch (e) {
                    console.error('Error updating shelf state:', e)
                }
            }

            // Reset the state for this entity's requests after processing the second request
            if (activePutShelfRequests.has(shelf_id)) {
                activePutShelfRequests.delete(shelf_id)
            }

            // not sure why this is here but likely necessary due to some race condition
            createContextMenuTemplate()

            return {
                type: 'request',
                value: new Request(request.url, options),
            }
        },
        modifyResponse: async (response, request) => {
            const copy = response.clone()
            let shelf = await copy.json()

            if (shelfState) {
                try {
                    shelfState.upsertShelf(shelf.meta, decodeShelf(shelf))
                } catch (e) {
                    // Silently handle error as per original implementation
                }
            }

            const modifiedData = InjectShelfTransientMetaSingle(shelf)

            return new Response(JSON.stringify(modifiedData), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
            })
        },
    })
}
