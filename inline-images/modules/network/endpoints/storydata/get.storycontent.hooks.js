const registerStorycontentGetHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'storycontent-get',
        priority: 10,
        urlPattern: '/user/objects/storycontent',
        methods: ['GET'],
        modifyResponse: async (response, request) => {
            console.log('intercept storycontent get (here we grab images for story)')
            const copy = response.clone()

            /** @type {EntityWrapper} */
            let data = await copy.json()

            //console.log('rawdata', data)

            const imageStore = await loadImagesFromLorebook(data)

            //console.log('waiting for early preflight finished')
            await waitForEarlyPreflight()
            //console.log('early preflight finished')

            storyImagesState.setStoryImages(data.meta, imageStore)

            console.log('story image data', imageStore, storyImagesState.getStoryImages(data.meta))

            return response
        },
    })
}
