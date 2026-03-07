/**
 * Hooks for handling GET requests to the shelves API endpoint
 */

const registerShelfGetHooks = () => {
    console.log('[NAIE] Registering shelf-get-all hook for /user/objects/shelf')
    NAIE.NETWORK.manager.registerHook({
        id: 'shelf-get-all',
        priority: 10,
        urlPattern: '/user/objects/shelf',
        methods: ['GET'],
        modifyResponse: async (response, request) => {
            console.log('[NAIE] shelf-get-all hook fired, intercepted:', request.url)
            const copy = response.clone()
            let data = await copy.json()
            console.log('[NAIE] shelf data received, objects:', data.objects?.length)
            shelfState = createShelfState(buildShelfMap(data.objects))
            const modifiedData = { objects: InjectShelfTransientMeta(data.objects) }

            return new Response(JSON.stringify(modifiedData), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
            })
        },
    })
}
