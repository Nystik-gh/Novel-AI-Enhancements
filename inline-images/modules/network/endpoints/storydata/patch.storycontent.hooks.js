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
            //console.log('original body', body)

            let memoryInput = getMemoryInput()
            if (memoryInput) {
                // remove forced save character sequence from input
                NAIE.DOM.setNativeValue(memoryInput, memoryInput.value.replace(SAVE_CHARACTER_SEQUENCE, ''))
            }
            if (memoryLock) {
                memoryLock.unlock()
            }

            /** @type {StoryContent} */
            let storycontent = await NAIE.CRYPTO.decompressDecryptObject(body)

            //console.log('original content', JSON.stringify(storycontent))

            const memoryContext = storycontent.context?.[0] || null
            if (memoryContext?.text.includes(SAVE_CHARACTER_SEQUENCE)) {
                // remove forced save character sequence from data
                memoryContext.text = memoryContext.text.replace(SAVE_CHARACTER_SEQUENCE, '')
            }

            storycontent = updateLorebookImages(storycontent, storyImagesState.getStoryImages(body.meta))

            // Encrypt the modified entry
            //console.log('modified content', JSON.stringify(storycontent))

            const encrypted = await NAIE.CRYPTO.encryptCompressObject({ ...body, data: storycontent })
            const modifiedBody = {
                ...body,
                data: encrypted,
            }

            //const modifiedBody = await saveImagesToLorebook(body, storyImagesState.getStoryImages(body.meta))

            options.body = JSON.stringify(modifiedBody)
            //console.log('modified body', modifiedBody)
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

            //console.log('rawdata', data)

            const imageStore = await loadImagesFromLorebook(data)

            storyImagesState.setStoryImages(data.meta, imageStore)

            console.log('story image data', imageStore, storyImagesState.getStoryImages(data.meta))

            return response
        },
    })
}
