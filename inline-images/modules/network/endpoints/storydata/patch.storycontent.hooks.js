const registerStorycontentPatchHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'storycontent-patch',
        priority: 10,
        urlPattern: '/user/objects/storycontent',
        methods: ['PATCH'],
        modifyRequest: async (request) => {
            console.log('intercept storydata patch (inject images into lorebook')
            const options = NAIE.NETWORK.getFetchOptions(request)
            const body = JSON.parse(options.body)
            console.log(body)

            //TODO: if memory contains script signature, block request and trigger second save by removing signature from memory input

            //TODO: inject images, if lorebook entry missing create it.

            options.body = JSON.stringify(body)

            return {
                type: 'request',
                value: new Request(request.url, options),
            }
        },
        modifyResponse: async (response, request) => {
            console.log('intercept storydata patch (load images from saved lorebook)')
            const copy = response.clone()
            let data = await copy.json()
            console.log(data)

            const modifiedData = data

            return new Response(JSON.stringify(modifiedData), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
            })
        },
    })
}
