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

const coreInit = () => {
    if (!wRef.NAIE_INSTANCE) {
        // Initialize core components before creating NAIE instance
        controls_initializeTemplates()
        
        console.log('creating naie instance')
        wRef.NAIE_INSTANCE = createNAIEInstance()
    } else {
        console.log('naie instance already exists, skipping')
    }

    NAIE = wRef.NAIE_INSTANCE
}

// ;INJECT DEPENDENCIES;

coreInit()
