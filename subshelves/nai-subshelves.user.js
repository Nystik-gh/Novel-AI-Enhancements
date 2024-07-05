// ==UserScript==
// @name         Novel AI nested shelves
// @namespace    git.nystik
// @version      0.1
// @description  Modify shelf api response to be a nested structure
// @match        https://novelai.net/*
// @grant        none
// @run-at       document-start
// @require      ./modules/*
// ==/UserScript==
'use strict'

// Config
const persistent_metadata_key = 'naie_persistent_metadata'
const shelfElementKey = 'naie_element'

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

    document.addEventListener('DOMContentLoaded', () => {
        // Process story-list if it exists initially

        waitForElement(storyListSelector).then((storyList) => {
            preflight()
            initModalObserver()
            mapShelfMetadata()
            initStoryListObserver(storyList)
            createBreadcrumbBar()
        })
    })
}

// ;INJECT DEPENDENCIES;

init()
