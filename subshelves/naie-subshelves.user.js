// ==UserScript==
// @name         Novel AI Enhanced: Sub-shelves
// @namespace    git.nystik
// @version      1.0
// @description  Adds nested shelves functionality
// @match        https://novelai.net/stories*
// @match        https://novelai.net/login
// @grant        none
// @run-at       document-start
// @require      ./modules/*
// ==/UserScript==
'use strict'

// Config
const persistent_metadata_key = 'naie_persistent_metadata'
const shelfElementKey = 'naie_element'

const appSelector = '#app'
const settingsButtonSelector = 'button[aria-label="Open Settings"]'
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

// elements
let homeButton = null

const init = () => {
    loadXhookScript()

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await preflight()
        } catch (e) {
            alert('Failed to initialize NAI Enhanced: Subshelves.\n\nDisable the script and create an issue on gitlab for support.')
        }
    })
}

// ;INJECT DEPENDENCIES;

// force a reload when the app navigates between /stories and /login
// this is to make sure we only load the script when we access /stories and not /login
let previousPath = window.location.pathname
const handleUrlChange = () => {
    const currentPath = window.location.pathname

    const targetPaths = ['/stories', '/login']

    if (targetPaths.includes(currentPath) && targetPaths.includes(previousPath) && currentPath !== previousPath) {
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
