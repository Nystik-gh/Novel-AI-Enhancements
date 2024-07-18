// ==UserScript==
// @name         Novel AI Enhanced: Sub-shelves
// @namespace    github.nystik-hg
// @version      1.0.6
// @description  Adds nested shelves functionality
// @match        https://novelai.net/*
// @grant        none
// @run-at       document-start
// @require      ./modules/*
// @require      ./lib/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=novelai.net
// @author       Nystik (https://gitlab.com/Nystik)
// @downloadUrl  https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/main/subshelves/dist/naie-subshelves.user.js
// @homepageUrl  https://github.com/Nystik-gh/Novel-AI-Enhancements
// @supportUrl   https://github.com/Nystik-gh/Novel-AI-Enhancements/issues
// ==/UserScript==
'use strict'

// Config
const persistent_metadata_key = 'naie_persistent_metadata'
const shelfElementKey = 'naie_element'
const shelfChildCountKey = 'naie_child_count'

const appSelector = '#app'
const settingsButtonSelector = 'button[aria-label="Open Settings"]'
const menubarSelector = '.menubar'
const storyListSelector = '.story-list:not(#sidebar-lock .story-list)'
const filterButtonSelector = 'button[aria-label="Open Sort Settings"]' // used to find the title bar
const newShelfButtonSelector = 'button[aria-label="create a new shelf"]'
const contextMenusSelector = 'button[aria-disabled]'
const modalSelector = 'div[role="dialog"][aria-modal="true"]'
const breadcrumbsBarSelector = '#breadcrumbs-bar' // created by this script

// State vars
let activeShelf = null
let storyListObserver = null
let modalObserver = null
let shelfState = null
let updateInProgress = false
let sidebarLock = null
let emptyStoryListFlag = false
let activeContextMenu = null

// elements
let homeButton = null

const init = () => {
    loadXhookScript()

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await preflight()
        } catch (e) {
            alert('Failed to initialize NAI Enhanced: Subshelves.\n\nDisable the script and create an issue on github for support.')
        }
    })
}

// ;INJECT DEPENDENCIES;

// Force a reload when the app navigates to or from /stories
// This is to make sure we only load the script when we access /stories

let previousPath = window.location.pathname
const handleUrlChange = () => {
    const currentPath = window.location.pathname

    if (
        (previousPath.startsWith('/stories') && !currentPath.startsWith('/stories')) ||
        (!previousPath.startsWith('/stories') && currentPath.startsWith('/stories'))
    ) {
        window.location.reload()
    }

    previousPath = currentPath
}

const observer = new MutationObserver(handleUrlChange)

observer.observe(document, { childList: true, subtree: true })

handleUrlChange() // Initial check

// Check if the current path is /stories before initializing
if (window.location.pathname.startsWith('/stories')) {
    init()
}
