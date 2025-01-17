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
// @run-at       document-start
// ==/UserScript==
'use strict'

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

/* ####### put.keystore.hooks.js ####### */

const registerKeystoreHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'keystore-put',
        priority: 10,
        urlPattern: '/user/keystore',
        methods: ['PUT'],
        modifyRequest: async (request) => {
            console.log('intercept keystore put (update keystore)')

            const options = NAIE.NETWORK.getFetchOptions(request)
            const body = JSON.parse(options.body)

            console.log(body)

            return {
                type: 'request',
                value: request,
            }
        },
        modifyResponse: async (response, request) => {
            console.log('intercept keystore put (update keystore)')

            try {
                const copy = response.clone()
                let data = await copy.json()

                console.log(data)

                const modifiedData = data

                return new Response(JSON.stringify(modifiedData), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                })
            } catch (e) {
                return response
            }
        },
    })
}


/* ---- end of put.keystore.hooks.js --- */


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


/* ######### get.user.hooks.js ######### */

const registerUserDataHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'user-data-get',
        priority: 10,
        urlPattern: '/user/data',
        methods: ['GET'],
        modifyResponse: async (response, request) => {
            console.log('intercept data get (here we grab initial keystore)')
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


/* ------ end of get.user.hooks.js ----- */


/* ####### register.preflight.js ####### */

const registerPreflight = async () => {
    // Register preflight hooks
    NAIE.PREFLIGHT.registerHook('main', 'inline-images-init', 10, async () => {
        NAIE.SERVICES.statusIndicator.displayMessage('Inline Images initialized')
    })
}


/* ---- end of register.preflight.js --- */


/* ########### network.mod.js ########## */

/**
 * Network module for handling API requests
 * Registers hooks with NAIE.NETWORK for intercepting and modifying requests/responses
 */

const initializeNetworkHooks = () => {
    // Initialize hooks for each endpoint group
    registerStorycontentHooks()
    registerUserDataHooks()
    registerKeystoreHooks()
}


/* ------- end of network.mod.js ------- */



// Only initialize on the stories page
if (window.location.pathname.startsWith('/stories')) {
    scriptInit = false
    init()
}

