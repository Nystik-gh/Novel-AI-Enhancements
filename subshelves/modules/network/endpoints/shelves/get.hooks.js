/**
 * Hooks for handling GET requests to the shelves API endpoint
 */

const registerShelfGetHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'shelf-get-all',
        priority: 10,
        urlPattern: '/user/objects/shelf',
        methods: ['GET'],
        modifyResponse: async (response, request) => {
            const copy = response.clone();
            let data = await copy.json();
            shelfState = createShelfState(buildShelfMap(data.objects));
            const modifiedData = { objects: InjectShelfTransientMeta(data.objects) };
            
            return new Response(JSON.stringify(modifiedData), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
            });
        }
    });
};
