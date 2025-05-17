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
// @require      ./modules/*
// @require      https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/refs/heads/inline-images/core/dist/naie-core.user.js?version=9
// @require      https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/refs/heads/inline-images/crypto/dist/naie-crypto.user.js?version=9
// @require      https://unpkg.com/interactjs/dist/interact.min.js
// @run-at       document-start
// ==/UserScript==
'use strict'
// state vars
/** @type {StoryImageState} */
let storyImagesState = null
let currentStoryId = null

let paragraphPositionState = null

let scriptInit = false
const wRef = unsafeWindow ? unsafeWindow : window

/** @type {NAIEWithCrypto} */
let NAIE = wRef.NAIE_INSTANCE

// Initialize everything
const init = () => {
    currentStoryId = getStoryIdFromUrl()
    if (scriptInit) return

    initializeNetworkHooks()
    setupUrlChangeListener()

    paragraphPositionState = createElementPositionState()

    NAIE.DOM.waitForElement('body', null, document).then(() => {
        watchForEditor()
    })

    document.addEventListener('DOMContentLoaded', async () => {
        if (scriptInit) return
        scriptInit = true
        try {
            NAIE.CORE.registerScript('inline-images')
            await registerPreflight()
            NAIE.CORE.markScriptReady('inline-images')
        } catch (e) {
            NAIE.LOGGING.getLogger().error(e)
            alert('Failed to initialize inline images script.\n\nDisable the script and report the issue.')
        }
    })
}

// ;INJECT DEPENDENCIES;

// Only initialize on the stories page
if (window.location.pathname.startsWith('/stories')) {
    scriptInit = false
    init()
}
