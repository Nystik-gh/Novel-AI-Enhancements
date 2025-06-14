// ==UserScript==
// THIS IS NOT A STANDALONE USER SCRIPT! DO NO INSTALL THIS SCRIPT DIRECTLY.
// @name         Novel AI Enhanced: Core
// @namespace    github.nystik-hg
// @version      1.1.0
// @description  Core library
// @require      ./lib/*
// @require      ./modules/misc/*
// @require      ./modules/logging/*
// @require      ./modules/dom/*
// @require      ./modules/extensions/*
// @require      ./modules/network/*
// @require      ./modules/nai/*
// @require      ./modules/preflight/*
// @require      ./modules/internal/*
// @require      ./modules/naie-object.js
// @author       Nystik (https://gitlab.com/Nystik)
// ==/UserScript==

;(() => {
    const wRef = unsafeWindow ? unsafeWindow : window

    /***
     * @type {NAIE}
     */
    let NAIE = null

    const coreInit = () => {
        const logger = LOGGING_UTILS.getLogger()
        if (!wRef.NAIE_INSTANCE) {
            logger.info('creating NAIE instance')
            wRef.NAIE_INSTANCE = createNAIEInstance()

            // Start waiting for scripts to register and become ready
            internal_startWaitingForScripts()
        } else {
            logger.info('NAIE instance already exists, skipping')
        }

        NAIE = wRef.NAIE_INSTANCE
    }

    // ;INJECT DEPENDENCIES;

    // Force a reload when the app navigates to or from /stories
    // This is to make sure we only load the script when we access /stories

    let previousPath = wRef.location.pathname
    const handleUrlChange = () => {
        const currentPath = wRef.location.pathname

        if (
            (previousPath.startsWith('/stories') && !currentPath.startsWith('/stories')) ||
            (!previousPath.startsWith('/stories') && currentPath.startsWith('/stories'))
        ) {
            wRef.location.reload()
        }

        previousPath = currentPath
    }

    const observer = new MutationObserver(handleUrlChange)

    observer.observe(document, { childList: true, subtree: true })

    handleUrlChange() // Initial check

    // Check if the current path is /stories before initializing
    if (wRef.location.pathname.startsWith('/stories')) {
        coreInit()
    }
})()
