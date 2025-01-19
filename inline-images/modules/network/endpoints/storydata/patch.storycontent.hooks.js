const registerStorycontentPatchHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'storycontent-patch',
        priority: 10,
        urlPattern: '/user/objects/storycontent',
        methods: ['PATCH'],
        modifyRequest: async (request) => {
            console.log('intercept storydata patch (inject images into lorebook')
            const options = NAIE.NETWORK.getFetchOptions(request)

            /** @type {EntityWrapper} */
            const body = JSON.parse(options.body)
            console.log('original body', body)

            //TODO: if memory contains script signature, block request and trigger second save by removing signature from memory input

            //TODO: inject images, if lorebook entry missing create it.
            const modifiedBody = await saveImagesToLorebook(body, storyImagesState.getStoryImages(body.meta))

            options.body = JSON.stringify(modifiedBody)
            console.log('modified body', modifiedBody)
            return {
                type: 'request',
                value: new Request(request.url, options),
            }
        },
        modifyResponse: async (response, request) => {
            console.log('intercept storydata patch (load images from saved lorebook)')
            const copy = response.clone()

            /** @type {EntityWrapper} */
            let data = await copy.json()

            console.log('rawdata', data)

            const imageStore = await loadImagesFromLorebook(data)

            storyImagesState.setStoryImages(data.meta, imageStore)

            console.log('story image data', imageStore, storyImagesState.getStoryImages(data.meta))

            return response
        },
    })
}
