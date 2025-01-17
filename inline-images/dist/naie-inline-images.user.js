// ==UserScript==
// @name         NAIE Inline Images
// @namespace    https://github.com/Nystik-gh/Novel-AI-Enhancements
// @version      0.1.0
// @description  Adds support for inline images in stories
// @author       Nystik
// @match        https://novelai.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=novelai.net
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.addStyle
// @require      https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/main/core/dist/naie-core.user.js
// @require      https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/refs/heads/inline-images/crypto/dist/naie-crypto.user.js
// @run-at       document-start
// ==/UserScript==
'use strict'
// state vars
let keystoreState = null
let storyImagesState = null

let scriptInit = false
const wRef = unsafeWindow ? unsafeWindow : window

/** @type {NAIE} */
let NAIE = wRef.NAIE_INSTANCE

const init = () => {
    initializeNetworkHooks()
    document.addEventListener('DOMContentLoaded', async () => {
        if (!scriptInit) {
            try {
                NAIE.CORE.registerScript('inline-images')
                await registerPreflight()
                NAIE.CORE.markScriptReady('inline-images')
                scriptInit = true
            } catch (e) {
                NAIE.LOGGING.getLogger().error(e)
                alert('Failed to initialize inline images script.\n\nDisable the script and report the issue.')
            }
        }
    })
}

/* ##### get.storycontent.hooks.js ##### */

const registerStorycontentGetHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'storycontent-get',
        priority: 10,
        urlPattern: '/user/objects/storycontent',
        methods: ['GET'],
        modifyResponse: async (response, request) => {
            console.log('intercept storycontent get (here we grab images for story)')
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


/* -- end of get.storycontent.hooks.js - */


/* #### patch.storycontent.hooks.js #### */

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


/* - end of patch.storycontent.hooks.js  */


/* ####### storycontent.hooks.js ####### */

const registerStorycontentHooks = () => {
    registerStorycontentGetHooks()
    registerStorycontentPatchHooks()
}


/* ---- end of storycontent.hooks.js --- */


/* ####### register.preflight.js ####### */

const registerPreflight = async () => {
    // Register preflight hooks
    NAIE.PREFLIGHT.registerHook('main', 'inline-images-init', 10, async () => {
        NAIE.SERVICES.statusIndicator.displayMessage('Inline Images initialized')
    })
}


/* ---- end of register.preflight.js --- */


/* ########## images.state.js ########## */

/** @returns {StoryImageState} */
const createStoryImageState = () => {
    const storyImageMap = new Map()

    const getMap = () => storyImageMap

    const getStoryImages = (storyId) => {
        return storyImageMap.get(storyId) || { images: [] }
    }

    /**
     * @param {string} storyId
     */
    const deleteStoryImages = (storyId) => {
        if (!storyImageMap.has(storyId)) {
            return
        }
        storyImageMap.delete(storyId)
    }

    const addImageToStory = (storyId, imageData) => {
        if (!storyImageMap.has(storyId)) {
            storyImageMap.set(storyId, { images: [imageData] })
            return
        }
        const currentMeta = storyImageMap.get(storyId)
        storyImageMap.set(storyId, {
            images: [...currentMeta.images, imageData],
        })
    }

    const removeImageFromStory = (storyId, imageId) => {
        if (!storyImageMap.has(storyId)) {
            return
        }

        const currentMeta = storyImageMap.get(storyId)
        storyImageMap.set(storyId, {
            images: currentMeta.images.filter((img) => img.id !== imageId),
        })
    }

    const updateImageInStory = (storyId, imageId, newImageData) => {
        if (!storyImageMap.has(storyId)) {
            return
        }

        const currentMeta = storyImageMap.get(storyId)
        storyImageMap.set(storyId, {
            images: currentMeta.images.map((img) => {
                if (img.id === imageId) {
                    return { ...img, ...newImageData }
                }
                return img
            }),
        })
    }

    return {
        getMap,
        getStoryImages,
        deleteStoryImages,
        addImageToStory,
        removeImageFromStory,
        updateImageInStory,
    }
}


/* ------- end of images.state.js ------ */


/* ########### network.mod.js ########## */

/**
 * Network module for handling API requests
 * Registers hooks with NAIE.NETWORK for intercepting and modifying requests/responses
 */

const initializeNetworkHooks = () => {
    // Initialize hooks for each endpoint group
    registerStorycontentHooks()
}


/* ------- end of network.mod.js ------- */



// Only initialize on the stories page
if (window.location.pathname.startsWith('/stories')) {
    scriptInit = false
    init()
}

