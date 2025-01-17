// ==UserScript==
// @name         NAIE Inline Images
// @namespace    https://github.com/Nystik-gh/Novel-AI-Enhancements
// @version      1.0.0
// @description  Cryptography functions
// @author       Nystik
// @require      ./modules/*
// @run-at       document-start
// ==/UserScript==
'use strict'
;(() => {
    let scriptInit = false
    const wRef = unsafeWindow ? unsafeWindow : window

    /** @type {NAIE} */
    let NAIE = wRef.NAIE_INSTANCE

    const init = async () => {
        if (NAIE) {
            console.log('initialize network hooks')
            initializeNetworkHooks()
            NAIE.CRYPTO = await initNAIECrypto()
        } else {
            console.warn('NAIE not initialized')
        }

        scriptInit = true
    }

    // ;INJECT DEPENDENCIES;

    // Only initialize on the stories page
    if (window.location.pathname.startsWith('/stories')) {
        scriptInit = false
        init()
    }
})()
