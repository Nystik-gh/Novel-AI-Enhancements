// ==UserScript==
// THIS IS NOT A STANDALONE USER SCRIPT! DO NO INSTALL THIS SCRIPT DIRECTLY.
// @name         Novel AI Enhanced: Core
// @namespace    github.nystik-hg
// @version      0.1.0
// @description  Core library
// @author       Nystik (https://gitlab.com/Nystik)
// ==/UserScript==

const init = () => {
    // Ensure window.NAIE_INSTANCE is set to a new NAIE instance if not already set
    if (!window.NAIE_INSTANCE) {
        console.log('creating naie instance')
        window.NAIE_INSTANCE = createNAIEInstance()
    } else {
        console.log('naie instance already exists, skipping')
    }
}

const naieGlobalFunc = () => {
    console.log('globally registered function')
}

/* ########### naie-object.js ########## */

const createNAIEInstance = () => {
    return {
        registerSettings: () => {
            console.log('register settings')
        },
        registerFetchPreHook: () => {
            console.log('register fetch pre hook')
        },
        registerFetchPostHook: () => {
            console.log('register fetch post hook')
        },
    }
}


/* ------- end of naie-object.js ------- */



init()

