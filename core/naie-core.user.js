// ==UserScript==
// THIS IS NOT A STANDALONE USER SCRIPT! DO NO INSTALL THIS SCRIPT DIRECTLY.
// @name         Novel AI Enhanced: Core
// @namespace    github.nystik-hg
// @version      0.1.0
// @description  Core library
// @require      ./modules/*
// @author       Nystik (https://gitlab.com/Nystik)
// ==/UserScript==

const wRef = unsafeWindow ? unsafeWindow : window

/***
 * @type {NAIE}
 */
let NAIE = null

const init = () => {
    // Ensure window.NAIE_INSTANCE is set to a new NAIE instance if not already set

    if (!wRef.NAIE_INSTANCE) {
        console.log('creating naie instance')
        wRef.NAIE_INSTANCE = createNAIEInstance()
    } else {
        console.log('naie instance already exists, skipping')
    }

    NAIE = wRef.NAIE_INSTANCE
}

const naieGlobalFunc = () => {
    console.log('globally registered function')
}

// ;INJECT DEPENDENCIES;

init()
