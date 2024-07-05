// ==UserScript==
// @name         Novel AI nested shelves
// @namespace    git.nystik
// @version      0.1
// @description  Modify shelf api response to be a nested structure
// @match        https://novelai.net/*
// @grant        none
// @run-at       document-start
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

/* ######## breadcrumbs.data.js ######## */

const makeBreadcrumbs = (id, map) => {
    const breadcrumbs = []
    let currentId = id

    while (currentId) {
        const obj = map.get(currentId)
        if (obj) {
            breadcrumbs.unshift(obj) // Add the object to the beginning of the array
            currentId = getMetadataObject(obj)?.parent_id || null
        } else {
            break // Break loop if object with currentId is not found
        }
    }

    return breadcrumbs
}


/* ----- end of breadcrumbs.data.js ---- */


/* ########## metadata.data.js ######### */

const metadataStartDelimiter = ';---naie_metadata;'
const metadataEndDelimiter = ';naie_metadata---;'
const header = '# THIS DATA IS CREATED BY NAI ENHANCEMENTS SCRIPT REMOVAL OR EDITING MAY BREAK FUNCTIONALITY\n'

// Parse function to extract metadata from the description
const parseMetadata = (description) => {
    const startDelimiter = metadataStartDelimiter
    const endDelimiter = metadataEndDelimiter

    const startIndex = description.indexOf(startDelimiter)
    const endIndex = description.indexOf(endDelimiter, startIndex + startDelimiter.length)

    if (startIndex !== -1 && endIndex !== -1) {
        const metadataBlock = description.substring(startIndex + startDelimiter.length, endIndex).trim()
        const lines = metadataBlock.split('\n')

        const metadata = {}

        lines.forEach((line) => {
            // Ignore comment lines starting with #
            if (line.startsWith('#')) {
                return
            }
            const parts = line.split(':')
            const key = parts[0].trim()
            const value = parts.slice(1).join(':').trim()

            metadata[key] = value
        })

        return metadata
    }

    return {}
}

const writeMetadata = (description, metadata) => {
    const startDelimiter = metadataStartDelimiter
    const endDelimiter = metadataEndDelimiter

    // Check if metadata object is empty
    if (Object.keys(metadata).length === 0) {
        // Remove metadata block if it exists
        const startIndex = description.indexOf(startDelimiter)
        const endIndex = description.indexOf(endDelimiter, startIndex + startDelimiter.length)

        if (startIndex !== -1 && endIndex !== -1) {
            // Remove the metadata block
            return description.substring(0, startIndex).trim() + '\n\n' + description.substring(endIndex + endDelimiter.length).trim()
        } else {
            // No metadata block found, return description as is
            return description.trim()
        }
    } else {
        // Construct the metadata block string
        let metadataBlock = `${startDelimiter}\n${header}`
        Object.entries(metadata).forEach(([key, value]) => {
            metadataBlock += `${key}: ${value}\n`
        })
        metadataBlock += `${endDelimiter}\n`

        // Check if metadata already exists, replace if it does, otherwise append at the end
        const startIndex = description.indexOf(startDelimiter)
        const endIndex = description.indexOf(endDelimiter, startIndex + startDelimiter.length)

        if (startIndex !== -1 && endIndex !== -1) {
            // Replace existing metadata block
            return description.substring(0, startIndex) + metadataBlock + description.substring(endIndex + endDelimiter.length)
        } else {
            // Append metadata block at the end
            return description.trim() + '\n\n' + metadataBlock
        }
    }
}

const getMetadataObject = (shelf) => {
    return shelf[persistent_metadata_key]
}

const setMetadataObject = (shelf, metadata) => {
    shelf[persistent_metadata_key] = metadata
}


/* ------ end of metadata.data.js ------ */


/* ########## shelves.data.js ########## */

const decodeShelf = (shelf) => {
    const decodedData = JSON.parse(decodeBase64(shelf.data))
    if (decodedData.children === undefined) {
        decodedData.children = []
    }
    const metadata = parseMetadata(decodedData.description)
    const decoded = { ...shelf, data: decodedData }
    setMetadataObject(decoded, metadata)
    return decoded
}

const decodeShelves = (shelves) => {
    return shelves.map(decodeShelf)
}

const encodeShelf = (item) => {
    const encodeDataFields = (item) => {
        for (const child of item.data.children) {
            if (child.type === 'shelf') {
                encodeDataFields(child)
            }
        }

        // Encode current item's data field to JSON and then base64
        const encodedData = encodeBase64(JSON.stringify(item.data))
        item.data = encodedData
    }

    // Start encoding from the given item
    encodeDataFields(item)
    return item
}

const encodeShelves = (decodedShelves) => {
    return structuredClone(decodedShelves).map(encodeShelf)
}

const getShelfTreeMap = (shelves) => {
    let decoded = decodeShelves(shelves)
}

const InjectShelfMetaSingle = (shelf) => {
    return injectShelfMeta([shelf])[0]
}

const injectShelfMeta = (shelves) => {
    let decoded = decodeShelves(shelves)

    for (let d of decoded) {
        let shelf_id = d.meta
        let shelf_metadata = getMetadataObject(d) ?? {}
        shelf_metadata.shelf_id = shelf_id
        d.data.description = writeMetadata(d.data.description, shelf_metadata)
    }

    return encodeShelves(decoded)
}

const buildShelfMap = (shelves) => {
    const decodedShelves = decodeShelves(shelves)

    const itemMap = new Map() // Map to quickly access items by id

    // First pass: create a map of items
    for (const item of decodedShelves) {
        item.data.children = item.data.children ? item.data.children : []
        itemMap.set(item.meta, item)
    }

    // Second pass: link child items to their parent items
    for (const item of decodedShelves) {
        const parent = getMetadataObject(item)?.parent_id !== undefined ? itemMap.get(getMetadataObject(item)?.parent_id) : null
        if (parent) {
            parent.data.children.push(item)
        }
    }

    return itemMap
}


/* ------- end of shelves.data.js ------ */


/* ######### breadcrumbs.dom.js ######## */

const getBreadcrumbBarEl = () => {
    return document.querySelector(breadcrumbsBarSelector)
}

const toggleBreadcrumbBar = () => {
    if (activeShelf === null) {
        // on home shelf
        let breadcrumbBar = getBreadcrumbBarEl()
        if (breadcrumbBar) {
            breadcrumbBar.style.display = 'none'
        }
    } else {
        let breadcrumbBar = getBreadcrumbBarEl()
        if (breadcrumbBar) {
            breadcrumbBar.style.display = 'flex'
        }
    }
}

const createBreadcrumbBar = () => {
    let titlebar = findTitleBar()

    if (titlebar && !document.querySelector(breadcrumbsBarSelector)) {
        let clone = titlebar.cloneNode(false)
        clone.id = breadcrumbsBarSelector.substring(1) // remove '#' to set correct id
        clone.style.fontSize = '0.8rem'
        clone.style.color = 'var(--loader-color)'

        clone.style.display = 'flex'
        clone.style.flexDirection = 'row'
        clone.style.flexWrap = 'wrap'
        clone.style.height = 'auto'
        clone.style.padding = '0 20px 5px 20px'

        titlebar.parentNode.insertBefore(clone, titlebar.nextSibling)
    }
}

const createCrumb = (title, onClick) => {
    const crumbStyles = {
        whiteSpace: 'nowrap',
        cursor: onClick ? 'pointer' : 'default',
    }

    const crumbEl = createElement('span', crumbStyles)
    crumbEl.textContent = title

    if (onClick) {
        crumbEl.addEventListener('click', onClick)
    }

    return crumbEl
}

const createCrumbSeparator = () => {
    // original separator html
    const svgHTML = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; height: 22px; width: 22px;"><path fill="none" d="M0 0h24v24H0V0z"></path><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>`
    const template = document.createElement('template')
    template.innerHTML = svgHTML.trim() // Use trim() to remove any extraneous whitespace
    let separator = template.content.firstChild
    separator.style.transform = 'scale(.8)'
    return separator
}

const insertBreadcrumbs = (shelf_id) => {
    const breadcrumbBar = getBreadcrumbBarEl()

    if (breadcrumbBar) {
        // Clear existing breadcrumbs
        breadcrumbBar.innerHTML = ''

        if (activeShelf) {
            const crumbData = makeBreadcrumbs(shelf_id, shelfState.getMap())

            const homeCrumb = createCrumb('Home', () => {
                navigateToHome()
            })
            breadcrumbBar.appendChild(homeCrumb)
            const separator = createCrumbSeparator()
            breadcrumbBar.appendChild(separator)

            // Create breadcrumb elements using reduce
            const crumbs = crumbData.reduce((acc, crumb, index) => {
                const crumbEl = createCrumb(
                    crumb.data.title,
                    index < crumbData.length - 1 ? () => handleSubSubshelfClick(crumb.meta) : null,
                )

                acc.appendChild(crumbEl)
                if (index < crumbData.length - 1) {
                    acc.appendChild(separator.cloneNode(true))
                }

                return acc
            }, document.createDocumentFragment())

            breadcrumbBar.appendChild(crumbs)
        }
    }
}


/* ----- end of breadcrumbs.dom.js ----- */


/* ######### contextMenu.dom.js ######## */

const waitForContextMenu = (isVisibleCheck) => {
    return new Promise((resolve, reject) => {
        const callback = (mutationsList, observer) => {
            mutationsList.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    Array.from(mutation.addedNodes).forEach((node) => checkContextMenu(node, observer))
                } else if (mutation.type === 'attributes' && isVisibleCheck) {
                    checkContextMenu(mutation.target, observer)
                }
            })
        }

        const checkContextMenu = (node, observer) => {
            const { contextMenu, editButton, deleteButton } = identifyContextMenu(node)
            if (contextMenu && editButton && deleteButton) {
                if (isVisibleCheck && contextMenu.style.visibility === 'hidden') {
                    return
                }
                console.log('stop observing contextmenu')
                observer.disconnect() // Stop observing
                resolve({ contextMenu, editButton, deleteButton })
            }
        }

        const observer = new MutationObserver(callback)
        const config = { childList: true, subtree: true }

        if (isVisibleCheck) {
            config.attributeFilter = ['style']
        }

        console.log('observing for contextmenu')
        observer.observe(document.body, config)
    })
}

const identifyContextMenu = (node) => {
    let contextMenu = null
    let editButton = null
    let deleteButton = null

    if (node.tagName === 'DIV' && node.style) {
        const buttons = node.querySelectorAll('button[aria-disabled="false"]')

        console.log('identifycontextmenu buttons', buttons)
        buttons.forEach((button) => {
            const iconDiv = button.querySelector('div > div')
            if (findElementWithMaskImage([iconDiv], ['edit', '.svg']).length > 0) {
                editButton = button
            } else if (findElementWithMaskImage([iconDiv], ['trash', '.svg']).length > 0) {
                deleteButton = button
            }
        })

        if (editButton && deleteButton) {
            contextMenu = node
        }
    }

    return { contextMenu, editButton, deleteButton }
}


/* ----- end of contextMenu.dom.js ----- */


/* ######### select.controls.js ######## */

// Styles for the dropdown container
const DROPDOWN_CONTAINER_STYLES = {
    top: '100%',
    position: 'absolute',
    width: '100%',
    zIndex: '1',
    backgroundColor: 'rgb(26, 28, 46)',
    borderRadius: '0px',
    boxShadow: 'rgba(52, 56, 92, 0.6) 0px 0px 0px 1px, rgba(0, 0, 0, 0.2) 0px 4px 11px',
    boxSizing: 'border-box',
    margin: '0px',
}

// Styles for the options list container
const DROPDOWN_LIST_STYLES = {
    maxHeight: '200px',
    overflowY: 'auto',
    position: 'relative',
    boxSizing: 'border-box',
    padding: '0px',
}

// Common styles for dropdown options
const DROPDOWN_OPTION_STYLES = {
    cursor: 'pointer',
    display: 'block',
    fontSize: 'inherit',
    width: '100%',
    userSelect: 'none',
    webkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
    color: 'rgb(255, 255, 255)',
    padding: '8px 12px',
    boxSizing: 'border-box',
}

const createSelectDropdown = (options, selectedValue) => {
    const dropdownContainer = createElement('div', DROPDOWN_CONTAINER_STYLES)
    const optionsList = createElement('div', DROPDOWN_LIST_STYLES)
    dropdownContainer.appendChild(optionsList)

    options.forEach(({ title, value }) => {
        const optionElement = createElement('div', {
            ...DROPDOWN_OPTION_STYLES,
            backgroundColor: value === selectedValue ? 'rgb(16, 18, 36)' : 'transparent',
        })

        optionElement.setAttribute('aria-disabled', 'false')
        optionElement.setAttribute('tabindex', '-1')
        optionElement.setAttribute('data-option-value', value)

        const optionText = createElement('span')
        optionText.textContent = title
        optionElement.appendChild(optionText)

        optionsList.appendChild(optionElement)
    })

    return dropdownContainer
}

const constructSelectControl = (options, selectedValue) => {
    const selectControl = selectControlTemplate.cloneNode(true)
    selectControl.id = ''

    const controlElement = selectControl.querySelector('.naie-select-control')
    const singleValueElement = selectControl.querySelector('.naie-select-value')
    const inputElement = selectControl.querySelector('.naie-select-input')

    const selectedOption = options.find((option) => option.value === selectedValue)
    if (selectedOption) {
        singleValueElement.textContent = selectedOption.title
    }

    const dropdown = createSelectDropdown(options, selectedValue)
    dropdown.style.display = 'none'
    selectControl.appendChild(dropdown)

    const updateDropdown = (filterText = '') => {
        const optionElements = dropdown.querySelectorAll('[data-option-value]')
        optionElements.forEach((optionElement) => {
            const title = optionElement.textContent.toLowerCase()
            if (title.includes(filterText.toLowerCase())) {
                optionElement.style.display = 'block'
            } else {
                optionElement.style.display = 'none'
            }
        })
    }

    const showDropdown = () => {
        dropdown.style.display = 'block'
        singleValueElement.style.display = 'none'
        inputElement.focus()
    }

    const hideDropdown = () => {
        dropdown.style.display = 'none'
        singleValueElement.style.display = 'block'
        inputElement.value = ''
        updateDropdown()
    }

    controlElement.addEventListener('click', showDropdown)

    inputElement.addEventListener('input', (e) => {
        inputElement.value = e.target.value
        inputElement.parentNode.dataset['value'] = e.target.value
        updateDropdown(e.target.value)
    })

    inputElement.addEventListener('blur', () => {
        // Delay hiding to allow for option selection
        hideDropdown()
        //setTimeout(hideDropdown, 200)
    })

    const optionElements = dropdown.querySelectorAll('[data-option-value]')
    optionElements.forEach((optionElement) => {
        optionElement.addEventListener('click', () => {
            const newValue = optionElement.getAttribute('data-option-value')
            const newTitle = optionElement.textContent
            singleValueElement.textContent = newTitle
            hideDropdown()

            optionElements.forEach((el) => {
                el.style.backgroundColor = el === optionElement ? 'rgb(16, 18, 36)' : 'transparent'
            })

            // Trigger a change event or callback if needed
        })
    })

    return selectControl
}


/* ----- end of select.controls.js ----- */


/* ########### general.dom.js ########## */

const simulateClick = (element) => {
    console.log('simulateClick', element)
    if (element) {
        element.click()
    }
}

const simulateRightClick = (element) => {
    const evt = new Event('contextmenu', { bubbles: true, cancelable: false })
    element.dispatchEvent(evt)
}

const simulateInputEvent = (element) => {
    element.dispatchEvent(new Event('input', { bubbles: true }))
}

const createElement = (tag, styles = {}) => {
    const element = document.createElement(tag)
    Object.assign(element.style, styles)
    return element
}

const waitForElement = (selector, timeout) => {
    const getElement = () => document.querySelector(selector)

    return new Promise((resolve) => {
        const element = getElement()
        if (element) {
            resolve(element)
        } else {
            const observer = new MutationObserver((mutationsList, observer) => {
                const element = getElement()
                if (element) {
                    observer.disconnect()
                    resolve(element)
                }
            })

            observer.observe(document.body, { childList: true, subtree: true, attributes: true })

            if (timeout) {
                setTimeout(() => {
                    observer.disconnect()
                    const element = getElement()
                    resolve(element || null)
                }, timeout)
            }
        }
    })
}

const addEventListenerOnce = (element, event, handler) => {
    // Construct a unique flag based on the event type and handler function
    const flag = `listenerAdded_${event}_${handler.name}`

    // Check if the event listener has already been added
    if (!element.dataset[flag]) {
        // Add the event listener
        element.addEventListener(event, handler)

        // Set the flag to indicate that the listener has been added
        element.dataset[flag] = 'true'
    }
}

const removeEventListener = (element, event, handler) => {
    // Construct a unique flag based on the event type and handler function
    const flag = `listenerAdded_${event}_${handler.name}`

    // Check if the event listener has already been added
    if (element.dataset[flag]) {
        // Add the event listener
        element.dataset[flag] = false
    }
}

const findTitleBar = () => {
    // Find the button with aria-label="Open Sort Settings"
    const sortSettingsButton = document.querySelector(filterButtonSelector)

    // manually traverse dom to expected home button
    const titleBarCandidate = sortSettingsButton?.parentNode?.parentNode

    if (titleBarCandidate && titleBarCandidate.tagName === 'DIV') {
        return titleBarCandidate
    }

    return null
}

const findElementWithMaskImage = (elements, urlSubstrings) => {
    let results = [...elements].filter((e) => {
        const maskImageValue = e ? window.getComputedStyle(e).getPropertyValue('mask-image') : null

        return maskImageValue && urlSubstrings.every((sub) => maskImageValue.includes(sub))
    })
    return results
}

const setNativeValue = (element, value) => {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set
    const prototype = Object.getPrototypeOf(element)
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set

    if (valueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value)
    } else {
        valueSetter.call(element, value)
    }
}


/* ------- end of general.dom.js ------- */


/* ######### homeButton.dom.js ######### */

const grabHomeButton = () => {
    const homeButtonCandidate = findHomeButton()
    if (homeButtonCandidate && homeButton !== homeButtonCandidate) {
        homeButton = homeButtonCandidate
        addEventListenerOnce(homeButton, 'click', () => {
            activeShelf = null
        })
    }
}

const findHomeButton = () => {
    const titleBar = findTitleBar()

    const homeButtonCandidate = titleBar?.firstElementChild?.firstElementChild

    const isHomeButton = findElementWithMaskImage([homeButtonCandidate?.firstElementChild], ['home', '.svg']).length > 0

    if (isHomeButton) {
        return homeButtonCandidate
    }

    return null
}


/* ------ end of homeButton.dom.js ----- */


/* ############ modal.dom.js ########### */

const initModalObserver = () => {
    if (modalObserver) {
        console.log('modal observer already initiated, aborting...')
        return
    }

    modalObserver = true

    console.log('init modal observer')

    const observerOptions = {
        childList: true,
    }

    const observerCallback = (mutationsList, observer) => {
        // Trigger mapShelfMetadata when mutations indicate changes
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const addedNodes = Array.from(mutation.addedNodes)
                const hasProjectionId = addedNodes.some(
                    (node) => node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('data-projection-id'),
                )

                if (hasProjectionId) {
                    modalObserver.disconnect()

                    waitForShelfSettingsModal(100)
                        .then((data) => {
                            if (!data.modal?.dataset['proxied']) {
                                constructShelfSettingModal(data)
                            }
                            observer.observe(document.body, observerOptions)
                        })
                        .catch((error) => {
                            // Not a settingsModal
                            // having an empty catch block doesn't feel great, should probably rework modal handling at some point.
                            observer.observe(document.body, observerOptions)
                        })
                    break
                }
            }
        }
    }

    modalObserver = new MutationObserver(observerCallback)
    modalObserver.observe(document.body, observerOptions)
}

const waitForModal = async (timeout) => {
    const modal = await waitForElement(modalSelector, timeout)

    const overlay = modal?.parentNode?.parentNode?.hasAttribute('data-projection-id') ? modal?.parentNode?.parentNode : null

    const closeButton = findElementWithMaskImage(modal.querySelectorAll('button > div'), ['cross', '.svg'])?.[0]

    return { modal, overlay, closeButton }
}


/* -------- end of modal.dom.js -------- */


/* ######### theme.settings.js ######### */

// implement elements as necessary
const waitForThemePanel = async (modal) => {
    const content = modal.querySelector('.settings-content')

    if (!content) {
        throw new Error('settings content not found')
    }

    const themeIndicator = await waitForElement('button[aria-label="Import Theme File"]', 1000)

    if (!themeIndicator) {
        throw new Error('cannot identify theme panel')
    }

    const fontSelect = content.querySelector('.font-select')

    return { fontSelect }
}


/* ------ end of theme.settings.js ----- */


/* ######### settings.modal.js ######### */

const getSettingsButton = () => {
    return document.querySelector('button[aria-label="Open Settings"]')
}

const waitForSettingsModal = async (timeout) => {
    console.log('waitForSettingsModal')
    const { modal, overlay } = await waitForModal(timeout)

    const sidebar = await waitForElement('.settings-sidebar', 1000)

    if (!sidebar) {
        throw new Error('No settings sidebar found')
    }

    console.log('sidebar', sidebar.cloneNode(true), sidebar.firstElementChild?.tagName)

    const { tabs, changelog, logout, closeButton } =
        document.querySelectorAll('button[href="/image"]').length === 2
            ? await handleSettingsMobile(sidebar)
            : await handleSettingsDesktop(modal, sidebar)

    console.log('tabs', tabs, changelog, logout)

    return {
        modal,
        overlay,
        closeButton,
        tabs,
        extra: { changelog, logout },
        panels: {
            //getAISettingsPanel: () => getPanel(tabs.ai_settings, waitForAISettingsPanel),
            //getInterfacePanel: () => getPanel(tabs.interface, waitForInterfacePanel),
            getThemePanel: () => getPanel(modal, tabs.theme, waitForThemePanel),
            //getAccountPanel: () => getPanel(tabs.account, waitForAccountPanel),
            //getTextToSpeechPanel: () => getPanel(tabs.text_to_speech, waitForTextToSpeechPanel),
            //getDefaultsPanel: () => getPanel(tabs.defaults, waitForDefaultsPanel),
            //getHotkeysPanel: () => getPanel(tabs.hotkeys, waitForHotkeysPanel),
        },
    }
}

const handleSettingsDesktop = async (modal, sidebar) => {
    console.log('handle settings desktop')

    do {
        await waitForElement('nullelement', 50)
    } while (sidebar?.firstChild?.nextSibling?.querySelectorAll('button').length !== 7)

    const buttons = sidebar.querySelectorAll('button')

    if (buttons.length !== 9) {
        throw new Error('Not all required buttons are found')
    }

    const tabs = {
        ai_settings: buttons[0],
        interface: buttons[1],
        theme: buttons[2],
        account: buttons[3],
        text_to_speech: buttons[4],
        defaults: buttons[5],
        hotkeys: buttons[6],
    }

    const changelog = buttons[7]
    const logout = buttons[8]

    const closeButton = findElementWithMaskImage(modal.querySelectorAll('button > div'), ['cross', '.svg'])?.[0]

    return { tabs, changelog, logout, closeButton }
}

const handleSettingsMobile = async (sidebar) => {
    console.log('handle settings mobile')
    const buttons = sidebar.querySelectorAll('button')

    if (buttons.length !== 9) {
        throw new Error('Not all required buttons are found')
    }

    const tabs = {
        ai_settings: buttons[1],
        interface: buttons[2],
        theme: buttons[3],
        account: buttons[4],
        text_to_speech: buttons[5],
        defaults: buttons[6],
    }

    const changelog = buttons[7]
    const logout = buttons[8]

    const closeButton = findElementWithMaskImage(modal.querySelectorAll('button > div'), ['cross', '.svg'])?.[0]

    return { tabs, changelog, logout, close }
}

const getPanel = async (modal, button, waitForFunction) => {
    const panelPromise = waitForFunction(modal)

    simulateClick(button) // Simulate the click on the button to show the panel

    const panel = await panelPromise

    return panel
}


/* ------ end of settings.modal.js ----- */


/* ###### shelf-settings.modal.js ###### */

const waitForShelfSettingsModal = async (timeout) => {
    console.log('waitForShelfSettingsModal')
    let { modal, overlay, closeButton } = await waitForModal(timeout)

    const title = modal.querySelector('input')
    const description = modal.querySelector('textarea')

    // Check if title or description is null
    if (!title || !description) {
        throw new Error('Title or description is null')
    }

    return { modal, overlay, closeButton, fields: { title, description } }
}

const constructShelfSettingModal = ({ fields: { title, description }, modal, ...rest }) => {
    console.log('constructShelfSettingModal')
    const cleanMetadata = (text) => {
        return writeMetadata(text, {})
    }

    const restoreMetadata = (text, metadata) => {
        return writeMetadata(text, metadata)
    }

    modal.setAttribute('data-proxied', true)

    // Clone the original textarea
    const clonedTextarea = description.cloneNode(true)

    // Hide the original textarea
    description.style.display = 'none'

    // Insert the cloned textarea into the DOM, right after the original one
    description.parentNode.insertBefore(clonedTextarea, description.nextSibling)

    const descriptionMetadata = parseMetadata(description.value)

    // Initialize the cloned textarea with sanitized content
    clonedTextarea.value = cleanMetadata(description.value)

    // Add an event listener to proxy the input
    clonedTextarea.addEventListener('input', (event) => {
        // Update the original textarea with unsanitized value
        setNativeValue(description, restoreMetadata(event.target.value, descriptionMetadata))
        simulateInputEvent(description)
    })

    // Return the modified fields with proxied description
    return { ...rest, modal, fields: { title, description: clonedTextarea, rawDescription: description } }
}


/* --- end of shelf-settings.modal.js -- */


/* ####### newShelfButton.dom.js ####### */

const findNewShelfButton = () => {
    return document.querySelector(newShelfButtonSelector)
}

const initNewSubShelfButton = () => {
    const newShelfButton = findNewShelfButton()

    console.log('initNewSubShelfButton', 'activeShelf', activeShelf, newShelfButton.disabled)

    if (activeShelf !== null) {
        newShelfButton.disabled = false

        newShelfButton.style.opacity = 1

        newShelfButton.dataset['newSubShelf'] = 'true'

        addEventListenerOnce(newShelfButton, 'click', (e) => {
            if (newShelfButton.dataset['newSubShelf'] === 'true') {
                e.preventDefault()
                console.log('subshelf new shelf click')
                createNewShelf()
            }
        })
    } else {
        newShelfButton.dataset['newSubShelf'] = false
    }
}


/* ---- end of newShelfButton.dom.js --- */


/* ########### shelves.dom.js ########## */

const getStoryListEl = () => {
    return document.querySelector(storyListSelector)
}

const initStoryListObserver = (storyListEl) => {
    if (!storyListEl) {
        throw new Error('The storyListEl element is required.')
    }

    if (storyListObserver) {
        console.log('observer already initiated, aborting...')
        return
    }

    const observerOptions = {
        childList: true,
        subtree: true,
        characterData: true,
    }

    const observerCallback = (mutationsList, observer) => {
        storyListObserver.disconnect()
        const textMutationElements = mutationsList.filter((m) => m.type === 'characterData').map((m) => m.target.parentElement)

        mapShelfMetadata().then(() => {
            if (textMutationElements.length > 0) {
                cleanShelfDescriptions(textMutationElements)
            }
            // Resume observing after mapShelfMetadata completes
            observer.observe(storyListEl, observerOptions)
            grabHomeButton()
        })
    }

    storyListObserver = new MutationObserver(observerCallback)
    storyListObserver.observe(storyListEl, observerOptions)
}

// map metadata injected into description onto data attributes on the shelf element
const mapShelfMetadata = async () => {
    console.log('mapShelfMetadata')
    // Find the div with class "story-list"
    const storyListDiv = getStoryListEl()

    // Check if the div exists before proceeding
    if (!storyListDiv) {
        return Promise.reject() // Resolve immediately if storyListDiv is not found
    }

    // Select direct child divs that do not have a role attribute and do not have the data-metadata-* attributes
    const childDivs = storyListDiv.querySelectorAll(`${storyListSelector} > div:not([role])`)

    const promises = []

    // Iterate over each child div
    childDivs.forEach((div) => {
        if (div.hasAttribute('data-metadata-processed')) {
            return
        }

        // Find all spans inside the current div
        const spans = div.querySelectorAll('span')

        // Iterate over each span
        spans.forEach((span) => {
            // Run parseMetadata on the span text contents
            const metadata = parseMetadata(span.textContent)

            // Check if parseMetadata found a "story_id" property in metadata
            if (!isObjEmpty(metadata)) {
                // Insert each metadata key as a data-metadata-[key]="value" onto that div
                Object.keys(metadata).forEach((key) => {
                    div.setAttribute(`data-metadata-${key}`, metadata[key])
                })

                // Mark the div as processed
                div.setAttribute('data-metadata-processed', 'true')

                // Update the span with the metadata using writeMetadata with empty metadata
                span.textContent = writeMetadata(span.textContent, {})

                // Store the metadata and the element in the shelves object
                shelfState.setShelfElement(metadata.shelf_id, div.cloneNode(true))

                addEventListenerOnce(div, 'click', () => {
                    activeShelf = metadata.shelf_id
                })

                promises.push(waitForElement(`[data-metadata-shelf_id="${metadata.shelf_id}"]`, 1000))
            }
        })
    })

    // Return a promise that resolves when all waitForElement promises are resolved
    let result = await Promise.all(promises)

    processStoryList()

    return result
}

const processStoryList = () => {
    if (!updateInProgress) {
        updateInProgress = true
        hideSubShelves()
        clearSubshelves()
        insertSubshelves()
        insertBreadcrumbs(activeShelf)
        toggleBreadcrumbBar()
        initNewSubShelfButton()
    }
    updateInProgress = false
}

const cleanShelfDescriptions = (spans) => {
    spans.forEach((span) => {
        const metadata = parseMetadata(span.textContent)
        if (!isObjEmpty(metadata)) {
            span.textContent = writeMetadata(span.textContent, {})
        }
    })
}

const hideSubShelves = () => {
    const subShelves = document.querySelectorAll(`${storyListSelector} > div[data-metadata-parent_id]`)
    subShelves.forEach((subShelf) => {
        subShelf.style.display = 'none'
    })
}

const clearSubshelves = () => {
    const storyList = getStoryListEl()
    const subshelves = storyList.querySelectorAll('div[data-metadata-subshelf="true"]')

    subshelves.forEach((shelf) => {
        storyList.removeChild(shelf)
    })
}

const insertSubshelves = () => {
    console.log('insertSubshelves', shelfState.getMap())
    if (activeShelf) {
        let currentShelf = activeShelf
        let subshelves = shelfState.getSubShelves(currentShelf)

        let storyList = getStoryListEl()
        subshelves.forEach((subshelf) => {
            let shelf = shelfState.getShelfElement(subshelf.meta).cloneNode(true)
            let shelf_id = subshelf.meta
            shelf.style.display = 'block'
            shelf.setAttribute(`data-metadata-subshelf`, true)
            addEventListenerOnce(shelf, 'click', () => {
                console.log('clicked', shelf_id)
                handleSubSubshelfClick(shelf_id)
            })
            storyList.prepend(shelf)
        })
    }
}

const updateShelfEntry = (element, data) => {
    element.id = 'tmpID'

    let titleEl = element.querySelector('#tmpID > div:first-child > span')
    let descriptionEl = element.querySelector('#tmpID > div:nth-child(2) > span')
    let countEl = element.querySelector('#tmpID > div:nth-child(3)')

    element.id = ''

    // Parse metadata from description
    const metadata = parseMetadata(descriptionEl.textContent)

    // Update/set data annotations with the extracted metadata
    if (!isObjEmpty(metadata)) {
        Object.keys(metadata).forEach((key) => {
            element.setAttribute(`data-metadata-${key}`, metadata[key])
        })
    }

    // Update the content of the elements
    titleEl.textContent = data.title
    descriptionEl.textContent = writeMetadata(data.description, {})
    countEl.textContent = data.children?.length || 0

    return element
}

//TODO: break out navigation logic to own function?
const handleSubSubshelfClick = async (subSubshelfId) => {
    try {
        await navigateToShelf(subSubshelfId)
    } catch (error) {
        console.error('Error handling sub-subshelf click:', error)
    }
}

const navigateToShelf = async (shelf_id) => {
    if (activeShelf) {
        console.log('navigating home as part of navigate to shelf')
        await navigateToHome()
    }

    console.log('navigating to shelf', shelf_id)

    if (shelf_id) {
        // Wait for the shelf to appear in the DOM
        console.log('waiting for', `div[data-metadata-shelf_id="${shelf_id}"]:not([data-metadata-subshelf])`)
        const selector = `div[data-metadata-shelf_id="${shelf_id}"]:not([data-metadata-subshelf])`
        const shelfElement = await waitForElement(selector, 1000)

        console.log('clicking', `div[data-metadata-shelf_id="${shelf_id}"]`)
        // Simulate click on the shelf
        simulateClick(shelfElement)
    }
    setTimeout(() => {
        processStoryList()
    }, 0)
}

const navigateToHome = async () => {
    const shelf_id = activeShelf

    if (shelf_id) {
        const setTimeoutPromise = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

        // avoids a race condition in event queue
        await setTimeoutPromise(0)
        console.log('try navigate home', shelf_id, homeButton)

        simulateClick(homeButton)
        const selector = `div[data-metadata-shelf_id="${shelf_id}"]:not([data-metadata-subshelf])`
        await waitForElement(selector)
        console.log('navigated home')
    }
}

//TODO: remove?
const findShelvesWithoutMeta = () => {
    const storyListDiv = getStoryListEl()
    return storyListDiv?.querySelectorAll(`${storyListSelector} > div:not([data-metadata-processed]):not([role])`)
}

const createNewShelf = async () => {
    const parent_id = activeShelf

    sidebarLock = lockSideBar()

    await navigateToHome()

    let newShelfButton = findNewShelfButton()
    console.log('newshelfButton', newShelfButton.dataset)
    if (newShelfButton.dataset['newSubShelf'] !== 'true') {
        activeShelf = parent_id
        simulateClick(newShelfButton)
    }
}

const updateShelfStateViaDescription = async (shelfElement, metadata) => {
    let contextMenuPromise = waitForContextMenu(true)

    setTimeout(() => {
        simulateRightClick(shelfElement)
    }, 0)

    const { contextMenu, editButton, deleteButton } = await contextMenuPromise
    if (contextMenu.style.visibility === 'hidden') {
        throw 'found wrong context meny'
    }
    contextMenu.style.visibility = 'hidden'

    simulateClick(editButton)
    let { modal, overlay, closeButton, fields } = await waitForShelfSettingsModal(100)

    setNativeValue(fields.description, writeMetadata('', metadata))
    simulateInputEvent(fields.description)

    simulateClick(closeButton)
}

const processNewShelf = async (shelf_id) => {
    const newShelfButton = findNewShelfButton()
    newShelfButton.disabled = true

    console.log('attempting to inject id: ', shelf_id)
    const inSubshelf = activeShelf !== null
    let parent_id = null
    if (inSubshelf) {
        parent_id = activeShelf
        simulateClick(homeButton)
    }

    const contextMenuPromise = waitForContextMenu()

    let newShelf = await waitForElement(`${storyListSelector} > div:not([data-metadata-processed]):not([role]):not([data-locked-shelf])`)

    let ctx = await contextMenuPromise

    if (!newShelf) {
        throw 'unable to find new shelf element'
    }

    if (!ctx) {
        throw 'unable to find new shelf context menu'
    }

    let metadata = { shelf_id }
    if (parent_id) {
        metadata = { ...metadata, parent_id }
        console.log('add parent id to metadata', metadata)
    }

    await updateShelfStateViaDescription(newShelf, metadata)
    newShelfButton.disabled = false

    if (parent_id) {
        console.log('navigating back to', parent_id)
        navigateToShelf(parent_id)
    }

    if (sidebarLock) {
        sidebarLock.unlock()
    }
}


/* ------- end of shelves.dom.js ------- */


/* ########### sidebar.dom.js ########## */

const getSidebarEl = () => {
    return document.querySelector('.menubar')
}

const lockSideBar = () => {
    const sidebar = getSidebarEl()

    const clone = sidebar.cloneNode(true)
    clone.id = 'sidebar-lock'

    const shelves = clone.querySelectorAll('div[data-metadata-shelf_id]')

    const clearDataset = (element) => {
        const keysToRemove = Object.keys(element.dataset)
        keysToRemove.forEach((key) => {
            delete element.dataset[key]
        })
    }

    shelves.forEach((s) => {
        clearDataset(s)
        s.setAttribute('data-locked-shelf', true)
    })

    sidebar.style.display = 'none'
    //sidebar.style.position = 'absolute'
    //sidebar.style.left = '-1000px'

    const sibling = sidebar.nextSibling
    sidebar.parentNode.insertBefore(clone, sibling)

    const unlock = () => {
        sidebar.parentNode.removeChild(clone)
        sidebar.style.removeProperty('display')
        //sidebar.style.removeProperty('position')
        //sidebar.style.removeProperty('left')
    }
    return { unlock }
}


/* ------- end of sidebar.dom.js ------- */


/* #### clone-dropdown.preflight.js #### */

let selectControlTemplate = null

const cloneSelectControl = async () => {
    simulateClick(getSettingsButton())

    const settingsModal = await waitForSettingsModal(500)
    console.log('settings modal', settingsModal)

    console.log('close button', settingsModal.closeButton)

    const { fontSelect } = await settingsModal.panels.getThemePanel()

    const template = createSelectControlTemplate(fontSelect)

    selectControlTemplate = template

    fontSelect.parentNode.insertBefore(
        constructSelectControl(
            [
                { title: 'Option 1', value: '1' },
                { title: 'Option 2', value: '2' },

                { title: 'Option 3', value: '3' },
                { title: 'Option 4', value: '4' },

                { title: 'Option 5', value: '5' },
            ],
            2,
        ),
        fontSelect,
    )
}

const createSelectControlTemplate = (fontSelect) => {
    const clone = fontSelect.cloneNode(true)
    const control = clone.children[2]

    if (!Array.from(control.classList).some((cls) => cls.endsWith('-control'))) {
        throw new Error('unable to identify select control')
    }

    const selectedValueText = control.firstChild.querySelector('span')
    const inputElement = control.firstChild.querySelector('input')

    inputElement.id = ''

    clone.classList.add('naie-select-box')
    control.classList.add('naie-select-control')
    selectedValueText.classList.add('naie-select-value')
    inputElement.classList.add('naie-select-input')

    selectedValueText.textContent = ''

    return clone
}


/* - end of clone-dropdown.preflight.js  */


/* ############ preflight.js ########### */

let preflightRun = false
const preflight = async () => {
    if (preflightRun) {
        return
    }
    preflightRun = true
    await cloneSelectControl()
}


/* -------- end of preflight.js -------- */


/* ########### shelf.state.js ########## */

const createShelfState = (shelfData) => {
    const shelfDataMap = shelfData

    const getMap = () => shelfDataMap

    const upsertShelf = (shelfId, shelfData) => {
        if (shelfDataMap.has(shelfId)) {
            updateShelf(shelfId, shelfData)
        } else {
            insertShelf(shelfId, shelfData)
        }
    }

    const insertShelf = (shelfId, shelfData) => {
        if (shelfDataMap.has(shelfId)) {
            throw new Error(`Shelf with ID ${shelfId} already exists.`)
        }
        shelfDataMap.set(shelfId, shelfData)
    }

    const getShelf = (shelfId) => {
        if (!shelfDataMap.has(shelfId)) {
            throw new Error(`Shelf with ID ${shelfId} does not exist.`)
        }
        return shelfDataMap.get(shelfId)
    }

    const getShelfByRemoteId = (remoteId) => {
        return shelfDataMap.values().find((s) => s.id === remoteId)
    }

    const updateShelf = (shelfId, newShelfData) => {
        if (!shelfDataMap.has(shelfId)) {
            throw new Error(`Shelf with ID ${shelfId} does not exist.`)
        }
        shelfDataMap.set(shelfId, newShelfData)
    }

    const deleteShelf = (shelfId) => {
        if (!shelfDataMap.has(shelfId)) {
            throw new Error(`Shelf with ID ${shelfId} does not exist.`)
        }
        console.log('deleting shelf with id', shelfId)
        shelfDataMap.delete(shelfId)
    }

    const setShelfElement = (shelfId, element) => {
        const shelfData = shelfDataMap.get(shelfId)
        if (shelfData !== undefined) {
            shelfDataMap.set(shelfId, { ...shelfData, [shelfElementKey]: element })
        }
    }

    const getShelfElement = (shelfId) => {
        const shelfData = shelfDataMap.get(shelfId)
        if (shelfData) {
            return shelfData[shelfElementKey]
        }
        return null
    }

    const getSubShelves = (parentId) => {
        return shelfDataMap.values().filter((s) => getMetadataObject(s)?.parent_id === parentId)
    }

    const getNonDescendants = (id) => {
        const result = []
        const descendants = new Set()
        const stack = [id]

        while (stack.length > 0) {
            const currentId = stack.pop()
            descendants.add(currentId)

            for (const [key, value] of this.map.entries()) {
                if (value.parent_id === currentId) {
                    stack.push(key)
                }
            }
        }

        for (const [key, value] of this.map.entries()) {
            if (!descendants.has(key)) {
                result.push(value)
            }
        }

        return result
    }

    return {
        getMap,
        upsertShelf,
        insertShelf,
        getShelf,
        getShelfByRemoteId,
        updateShelf,
        deleteShelf,
        setShelfElement,
        getShelfElement,
        getSubShelves,
        getNonDescendants,
    }
}


/* ------- end of shelf.state.js ------- */


/* ########## base64.utils.js ########## */

const decodeBase64 = (str) => {
    return atob(str)
}

const encodeBase64 = (str) => {
    return btoa(str)
}


/* ------- end of base64.utils.js ------ */


/* ########### misc.utils.js ########### */

const isObjEmpty = (obj) => {
    for (const prop in obj) {
        if (Object.hasOwn(obj, prop)) {
            return false
        }
    }

    return true
}


/* -------- end of misc.utils.js ------- */


/* ############# helpers.js ############ */

const getFetchOptions = (request) => {
    return {
        method: request.method,
        headers: request.headers,
        body: request.body,
        timeout: request.timeout,
        credentials: request.withCredentials ? 'include' : 'same-origin',
    }
}


/* --------- end of helpers.js --------- */


/* ############## hooks.js ############# */

const loadXhookScript = () => {
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/xhook@latest/dist/xhook.min.js'
    script.onload = initializeXhook
    document.documentElement.prepend(script)
}

const initializeXhook = () => {
    //xhook.after(responseModifier);
    const nativeFetch = xhook.fetch.bind(window)
    xhook.before(beforeHook(nativeFetch))
}

const beforeHook = (nativeFetch) => async (request, callback) => {
    const fetchOptions = preRequestHandlers(request)

    try {
        if (fetchOptions.shouldBlock) {
            callback(new Response('{}', { status: 418, statusText: 'Blocked by client' }))
            return
        }

        const raw_response = await nativeFetch(request.url, fetchOptions)

        const response = await postRequestHandler(request, raw_response)

        callback(response)
    } catch (error) {
        console.error('Error fetching:', error)
    }
}


/* ---------- end of hooks.js ---------- */


/* ####### before-shelf-delete.js ###### */

const preShelfDelete = (request) => {
    const options = getFetchOptions(request)
    const remoteId = request.url.split('/').pop()

    if (shelfState) {
        try {
            const shelf = shelfState.getShelfByRemoteId(remoteId)
            console.log('delete id', shelf.meta)
            const parent = getMetadataObject(shelf)?.parent_id
            shelfState.deleteShelf(shelf.meta)
            // bypass navigate home
            activeShelf = null
            //navigate to parent shelf
            navigateToShelf(parent)
        } catch (e) {}
    }

    return options
}


/* --- end of before-shelf-delete.js --- */


/* ####### before-shelf-patch.js ####### */

const preShelfPatch = (request) => {
    const options = getFetchOptions(request)

    const body = JSON.parse(options.body)
    const data = JSON.parse(decodeBase64(body.data))

    const metadata = parseMetadata(data.description)
    console.log('patch metadata', structuredClone(metadata))
    delete metadata.shelf_id

    data.description = writeMetadata(data.description, metadata)
    body.data = encodeBase64(JSON.stringify(data))

    options.body = JSON.stringify(body)

    return options
}


/* ---- end of before-shelf-patch.js --- */


/* ######## before-shelf-put.js ######## */

const activePutShelfRequests = new Map()

const preShelfPut = (request) => {
    const options = getFetchOptions(request)
    const body = JSON.parse(options.body)
    const data = JSON.parse(decodeBase64(body.data))
    const shelf_id = body.meta

    // Check if this is the first request for this meta
    if (!activePutShelfRequests.has(shelf_id)) {
        // Mark this request to be blocked

        // Handle the new process
        processNewShelf(shelf_id) // This will trigger a new PUT request
        activePutShelfRequests.set(shelf_id, 1)

        console.log('First request marked to be blocked. body:', body, 'data:', data)
        options.shouldBlock = true

        return options
    }

    const metadata = parseMetadata(data.description)
    console.log('PUT request. body:', body, 'data:', data, structuredClone(metadata))
    delete metadata.shelf_id

    data.description = writeMetadata(data.description, metadata)
    body.data = encodeBase64(JSON.stringify(data))

    options.body = JSON.stringify(body)

    if (shelfState) {
        try {
            shelfState.upsertShelf(shelf_id, decodeShelf(body))
        } catch (e) {
            console.error('Error updating shelf state:', e)
        }
    }

    // Reset the state for this entity's requests after processing the second request
    if (activePutShelfRequests.has(shelf_id)) {
        activePutShelfRequests.delete(shelf_id)
    }

    return options
}


/* ----- end of before-shelf-put.js ---- */


/* ########## request-hooks.js ######### */

const preRequestHandlers = (request) => {
    const baseShelfUrl = 'https://api.novelai.net/user/objects/shelf'
    const method = request.method?.toLowerCase()

    if (request.url.startsWith(baseShelfUrl)) {
        switch (method) {
            case 'put':
                return preShelfPut(request)
            case 'patch':
                return preShelfPatch(request)
            case 'delete':
                return preShelfDelete(request)
            default:
                return getFetchOptions(request)
        }
    } else {
        return getFetchOptions(request)
    }
}


/* ------ end of request-hooks.js ------ */


/* ####### after-shelf-delete.js ####### */

const postShelfDelete = async (response) => {
    //const copy = response.clone()
    //let shelf = await copy.json()

    /*if (shelfState) {
        try {
            shelfState.delete(shelf.meta)
        } catch (e) {}
    }*/

    return response
}


/* ---- end of after-shelf-delete.js --- */


/* ####### after-shelf-get-all.js ###### */

const postShelfGetAll = async (response) => {
    const copy = response.clone()
    let data = await copy.json()
    shelfState = createShelfState(buildShelfMap(data.objects))
    console.log('after response shelf map', shelfState)
    const modifiedData = { objects: injectShelfMeta(data.objects) }
    console.log('data', data)
    console.log('modifiedData', modifiedData)
    const modifiedText = JSON.stringify(modifiedData)
    const modifiedResponse = new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    })

    return modifiedResponse
}


/* --- end of after-shelf-get-all.js --- */


/* ######### after-shelf-put.js ######## */

const postShelfPut = async (response) => {
    const copy = response.clone()
    let shelf = await copy.json()

    if (activePutShelfRequests.has(shelf.meta)) {
        const newValue = activePutShelfRequests.get(shelf.meta) - 1
        if (newValue <= 0) {
            activePutShelfRequests.delete(shelf.meta)
        } else {
            activePutShelfRequests.set(shelf.meta, newValue)
        }
    }

    if (shelfState) {
        try {
            shelfState.upsertShelf(shelf.meta, decodeShelf(shelf))
        } catch (e) {}
    }
    console.log('map', shelf.meta, shelfState.getMap())

    const modifiedData = InjectShelfMetaSingle(shelf)

    const modifiedText = JSON.stringify(modifiedData)
    const modifiedResponse = new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    })

    return modifiedResponse
}


/* ----- end of after-shelf-put.js ----- */


/* ######### response-hooks.js ######### */

const postRequestHandler = async (request, response) => {
    const baseShelfUrl = 'https://api.novelai.net/user/objects/shelf'
    const method = request.method?.toLowerCase()

    if (request.url.startsWith(baseShelfUrl)) {
        switch (method) {
            case 'get':
                return await postShelfGetAll(response)
            case 'patch':
                // Add your patch logic here
                break
            case 'put':
                return await postShelfPut(response)
            case 'delete':
                return await postShelfDelete(response)
            default:
                return response
        }
    } else {
        return response
    }
}


/* ------ end of response-hooks.js ----- */



init()

