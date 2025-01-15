// ==UserScript==
// @name         Novel AI Enhanced: Sub-shelves
// @namespace    github.nystik-gh
// @version      2.0.4
// @description  Adds nested shelves functionality
// @match        https://novelai.net/*
// @grant        none
// @run-at       document-start
// @require      ./modules/*
// @require      https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/main/core/dist/naie-core.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=novelai.net
// @author       Nystik (https://gitlab.com/Nystik)
// @downloadUrl  hhttps://github.com/Nystik-gh/Novel-AI-Enhancements/raw/main/subshelves/dist/naie-subshelves.user.js
// @homepageUrl  https://github.com/Nystik-gh/Novel-AI-Enhancements
// @supportUrl   https://github.com/Nystik-gh/Novel-AI-Enhancements/issues
// ==/UserScript==
'use strict'

// Config
const persistent_metadata_key = 'naie_persistent_metadata'
const shelfElementKey = 'naie_element'
const shelfChildCountKey = 'naie_child_count'

const menubarSelector = '.menubar'
const storyListSelector = '.story-list:not(#sidebar-lock .story-list)'
const newShelfButtonSelector = 'button[aria-label="create a new shelf"]'
//const contextMenusSelector = 'button[aria-disabled]'
const breadcrumbsBarSelector = '#breadcrumbs-bar' // created by this script

// State vars
let activeShelf = null
let storyListObserver = null
//let modalObserver = null
let shelfState = null
let updateInProgress = false
let sidebarLock = null
let emptyStoryListFlag = false
let activeContextMenu = null

// elements
let homeButton = null

let scriptInit = false

const wRef = unsafeWindow ? unsafeWindow : window
/***
 * @type {NAIE}
 */
let NAIE = wRef.NAIE_INSTANCE

const init = () => {
    // Must be run as early as possible in order to be able to hook initial shelf request
    initializeNetworkHooks()
    document.addEventListener('DOMContentLoaded', async () => {
        if (!scriptInit) {
            try {
                NAIE.CORE.registerScript('naie-subshelves')
                await preflight()
                NAIE.CORE.markScriptReady('naie-subshelves')
                scriptInit = true
            } catch (e) {
                NAIE.LOGGING.getLogger().error(e)
                alert('Failed to initialize NAI Enhanced: Subshelves.\n\nDisable the script and create an issue on github for support.')
            }
        }
    })
}

// ;INJECT DEPENDENCIES;

// Check if the current path is /stories before initializing
if (window.location.pathname.startsWith('/stories')) {
    scriptInit = false
    init()
}
