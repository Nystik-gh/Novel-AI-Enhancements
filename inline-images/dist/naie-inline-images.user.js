// ==UserScript==
// @name         NAIE Inline Images
// @namespace    https://github.com/Nystik-gh/Novel-AI-Enhancements
// @version      0.1.0
// @description  Adds support for inline images in stories
// @author       Nystik
// @match        https://novelai.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=novelai.net
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/refs/heads/inline-images/core/dist/naie-core.user.js?version=9
// @require      https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/refs/heads/inline-images/crypto/dist/naie-crypto.user.js?version=4
// @run-at       document-start
// ==/UserScript==
'use strict'
// state vars
/** @type {StoryImageState} */
let storyImagesState = null

let scriptInit = false
const wRef = unsafeWindow ? unsafeWindow : window

/** @type {NAIEWithCrypto} */
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

/* ######### create.lorebook.js ######## */

// Functions for creating lorebook entries and categories

const sortingPrefix = 'Ξ'
const NAIE_DATA_LB_CATEGORY_NAME = 'NAIE_data'
const NAIE_IMAGE_STORE_ENTRY_NAME = 'NAIE-inline-image-store'

/**
 * Creates a new NAIE data category
 * @returns {LorebookCategory}
 */
const createLorebookCategory = () => {
    const generateId = () => crypto.randomUUID()

    return {
        name: `${sortingPrefix}${NAIE_DATA_LB_CATEGORY_NAME}`,
        id: generateId(),
        enabled: false,
        createSubcontext: false,
        subcontextSettings: {
            text: '',
            contextConfig: {
                prefix: '',
                suffix: '\n',
                tokenBudget: 1,
                reservedTokens: 0,
                budgetPriority: 400,
                trimDirection: 'trimBottom',
                insertionType: 'newline',
                maximumTrimType: 'sentence',
                insertionPosition: -1,
            },
            lastUpdatedAt: Date.now(),
            displayName: 'New Lorebook Entry',
            id: generateId(),
            keys: [],
            searchRange: 1000,
            enabled: true,
            forceActivation: false,
            keyRelative: false,
            nonStoryActivatable: false,
            category: '',
            loreBiasGroups: [
                {
                    phrases: [],
                    ensureSequenceFinish: false,
                    generateOnce: true,
                    bias: 0,
                    enabled: true,
                    whenInactive: false,
                },
            ],
        },
        useCategoryDefaults: false,
        categoryDefaults: {
            text: '',
            contextConfig: {
                prefix: '',
                suffix: '\n',
                tokenBudget: 1,
                reservedTokens: 0,
                budgetPriority: 400,
                trimDirection: 'trimBottom',
                insertionType: 'newline',
                maximumTrimType: 'sentence',
                insertionPosition: -1,
            },
            lastUpdatedAt: Date.now(),
            displayName: 'New Lorebook Entry',
            id: generateId(),
            keys: [],
            searchRange: 1000,
            enabled: true,
            forceActivation: false,
            keyRelative: false,
            nonStoryActivatable: false,
            category: '',
            loreBiasGroups: [
                {
                    phrases: [],
                    ensureSequenceFinish: false,
                    generateOnce: true,
                    bias: 0,
                    enabled: true,
                    whenInactive: false,
                },
            ],
        },
        categoryBiasGroups: [
            {
                phrases: [],
                ensureSequenceFinish: false,
                generateOnce: true,
                bias: 0,
                enabled: true,
                whenInactive: false,
            },
        ],
        open: false,
    }
}

/**
 * Creates a new image store entry
 * @param {string} categoryId - ID of the parent category
 * @returns {LoreEntry}
 */
const createLorebookImageStore = (categoryId) => {
    const generateId = () => crypto.randomUUID()

    return {
        text: JSON.stringify({ images: [] }),
        contextConfig: {
            prefix: '',
            suffix: '\n',
            tokenBudget: 1,
            reservedTokens: 0,
            budgetPriority: 400,
            trimDirection: 'trimBottom',
            insertionType: 'newline',
            maximumTrimType: 'sentence',
            insertionPosition: -1,
        },
        lastUpdatedAt: Date.now(),
        displayName: NAIE_IMAGE_STORE_ENTRY_NAME,
        id: generateId(),
        keys: ['inline-image-store'],
        searchRange: 1000,
        enabled: false,
        forceActivation: false,
        keyRelative: false,
        nonStoryActivatable: false,
        category: categoryId,
        loreBiasGroups: [
            {
                phrases: [],
                ensureSequenceFinish: false,
                generateOnce: true,
                bias: 0,
                enabled: false,
                whenInactive: false,
            },
        ],
        hidden: false,
    }
}


/* ----- end of create.lorebook.js ----- */


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
    NAIE.PREFLIGHT.registerHook('early', 'inline-images-init-early', 10, async () => {
        storyImagesState = createStoryImageState()
    })

    NAIE.PREFLIGHT.registerHook('main', 'inline-images-init-main', 10, async () => {
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

    const setStoryImages = (storyId, imageMeta) => {
        storyImageMap.set(storyId, imageMeta)
    }

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
        setStoryImages,
        deleteStoryImages,
        addImageToStory,
        removeImageFromStory,
        updateImageInStory,
    }
}


/* ------- end of images.state.js ------ */


/* ########## lorebook.mod.js ########## */

// Lorebook module for handling image operations

/**
 * Gets the image store entry from a decrypted lorebook
 * @param {Lorebook} lorebook - The decrypted lorebook
 * @returns {LoreEntry|undefined} The image store entry if found
 */
const findImageStoreEntry = (lorebook) => {
    return lorebook.entries?.find((e) => e.displayName === NAIE_IMAGE_STORE_ENTRY_NAME)
}

/**
 * Gets or creates the NAIE data category and image store entry
 * @param {Lorebook} lorebook - The decrypted lorebook
 * @returns {LoreEntry} The category and entry
 */
const getOrCreateImageStore = (lorebook) => {
    // Find or create the category
    let dataCategory = lorebook.categories?.find((c) => c.name.includes(NAIE_DATA_LB_CATEGORY_NAME))
    if (!dataCategory) {
        dataCategory = createLorebookCategory()
        lorebook.categories = lorebook.categories || []
        lorebook.categories.push(dataCategory)
    }

    // Find or create the entry
    let imageStore = lorebook.entries?.find((e) => e.displayName === NAIE_IMAGE_STORE_ENTRY_NAME)
    if (!imageStore) {
        imageStore = createLorebookImageStore(dataCategory.id)
        lorebook.entries = lorebook.entries || []
        lorebook.entries.push(imageStore)
    }

    return imageStore
}

/**
 * Loads images from a lorebook entry
 * @param {EntityWrapper} entityWrapper - The wrapped lorebook entry
 * @returns {Promise<StoryImageMeta>} Object containing array of image records
 */
const loadImagesFromLorebook = async (entityWrapper) => {
    try {
        /** @type {StoryContent} */
        let decrypted = await NAIE.CRYPTO.decompressDecryptObject(entityWrapper.data)

        const imageStore = findImageStoreEntry(decrypted.lorebook)
        if (!imageStore) {
            return { images: [] }
        }

        try {
            return JSON.parse(imageStore.text)
        } catch (e) {
            console.error('Failed to parse image store data:', e)
            return { images: [] }
        }
    } catch (error) {
        console.error('Failed to load images from lorebook:', error)
        throw error
    }
}

/**
 * Saves images to a lorebook entry
 * @param {EntityWrapper} entityWrapper - The wrapped lorebook entry
 * @param {StoryImageMeta} imageMeta - The image metadata to save
 * @returns {Promise<EntityWrapper>} The updated lorebook entry
 */
const saveImagesToLorebook = async (entityWrapper, imageMeta) => {
    try {
        /** @type {StoryContent} */
        let decrypted = await NAIE.CRYPTO.decompressDecryptObject(entityWrapper.data)

        const imageStore = getOrCreateImageStore(decrypted.lorebook)
        imageStore.text = JSON.stringify(imageMeta)
        //imageStore.lastUpdatedAt = Date.now()

        // Encrypt the modified entry
        console.log('modified content', decrypted)
        const encrypted = await NAIE.CRYPTO.encryptCompressObject(decrypted)
        return {
            ...entityWrapper,
            data: encrypted,
        }
    } catch (error) {
        console.error('Failed to save images to lorebook:', error)
        throw error
    }
}


/* ------- end of lorebook.mod.js ------ */


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

