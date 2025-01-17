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
// @require      ./modules/*
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

// ;INJECT DEPENDENCIES;

// Only initialize on the stories page
if (window.location.pathname.startsWith('/stories')) {
    scriptInit = false
    init()
}
