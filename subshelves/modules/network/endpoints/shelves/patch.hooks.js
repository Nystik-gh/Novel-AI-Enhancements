/**
 * Hooks for handling PATCH requests to the shelves API endpoint
 */

const registerShelfPatchHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'shelf-patch',
        priority: 10,
        urlPattern: '/user/objects/shelf',
        methods: ['PATCH'],
        modifyRequest: async (request) => {
            const options = NAIE.NETWORK.getFetchOptions(request)
            const body = JSON.parse(options.body)
            const data = JSON.parse(NAIE.MISC.decodeBase64(body.data))
            const shelf_id = body.meta

            // Strip transient metadata from description
            data.description = stripTransientMetadataFromText(data.description)
            body.data = NAIE.MISC.encodeBase64(JSON.stringify(data))
            options.body = JSON.stringify(body)

            // Update shelf state
            if (shelfState) {
                try {
                    shelfState.upsertShelf(shelf_id, decodeShelf(body))
                    processStoryList()
                } catch (e) {
                    console.error('Error updating shelf state:', e)
                }
            }

            return {
                type: 'request',
                value: new Request(request.url, options),
            }
        },
        modifyResponse: async (response, request) => {
            const copy = response.clone()
            let shelf = await copy.json()

            // Update shelf state with response data
            if (shelfState) {
                try {
                    shelfState.upsertShelf(shelf.meta, decodeShelf(shelf))
                } catch (e) {
                    // Silently handle error as per original implementation
                }
            }

            // Inject transient metadata and create modified response
            const modifiedData = InjectShelfTransientMetaSingle(shelf)

            // Force refresh story list after patch
            forceStoryListRefresh()

            return new Response(JSON.stringify(modifiedData), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
            })
        },
    })
}
