// ==UserScript==
// @name         Novel AI Enhanced: Sub-shelves
// @namespace    github.nystik-gh
// @version      2.0.4
// @description  Adds nested shelves functionality
// @match        https://novelai.net/*
// @grant        none
// @run-at       document-start
// @require      https://github.com/Nystik-gh/Novel-AI-Enhancements/raw/refs/heads/inline-images/core/dist/naie-core.user.js?version=11
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

/* ######## breadcrumbs.data.js ######## */

const makeBreadcrumbs = (id, map) => {
    const breadcrumbs = []
    let currentId = id

    while (currentId) {
        const obj = map.get(currentId)
        if (obj) {
            breadcrumbs.unshift(obj)
            currentId = getMetadataObject(obj)?.parent_id || null
        } else {
            break
        }
    }

    return breadcrumbs
}


/* ----- end of breadcrumbs.data.js ---- */


/* ########## metadata.data.js ######### */

const metadataStartDelimiter = ';---naie_metadata;'
const metadataEndDelimiter = ';naie_metadata---;'
const header = '# THIS DATA IS CREATED BY NAI ENHANCEMENTS. EDITING MAY BREAK FUNCTIONALITY\n'

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

const tranientMetadataKeys = ['shelf_id']

const stripTransientMetadataFromObject = (metadata) => {
    const result = { ...metadata }
    tranientMetadataKeys.forEach((key) => {
        delete result[key]
    })
    return result
}

const stripTransientMetadataFromText = (text) => {
    const meta = parseMetadata(text)

    const cleanText = writeMetadata(text, {})

    const cleanMeta = stripTransientMetadataFromObject(meta)

    return writeMetadata(cleanText, cleanMeta)
}


/* ------ end of metadata.data.js ------ */


/* ########## shelves.data.js ########## */

const decodeShelf = (shelf) => {
    const decodedData = JSON.parse(NAIE.MISC.decodeBase64(shelf.data))
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

        const encodedData = NAIE.MISC.encodeBase64(JSON.stringify(item.data))
        item.data = encodedData
    }

    encodeDataFields(item)
    return item
}

const encodeShelves = (decodedShelves) => {
    return structuredClone(decodedShelves).map(encodeShelf)
}

const getShelfTreeMap = (shelves) => {
    let decoded = decodeShelves(shelves)
}

const InjectShelfTransientMetaSingle = (shelf) => {
    return InjectShelfTransientMeta([shelf])[0]
}

//injects transient meta into description
const InjectShelfTransientMeta = (shelves) => {
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

    const itemMap = new Map()

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

const getNumChildrenFromDom = () => {
    const shelves = document.querySelectorAll(
        `${storyListSelector} > div[data-metadata-shelf_id]:not([role]):not([data-metadata-subshelf="true"])`,
    )

    for (const shelfEl of shelves) {
        shelfEl.id = 'tmpShelfID'
        let countEl = shelfEl.querySelector('#tmpShelfID > div:nth-child(3):not(.naie-computed-count)')
        shelfEl.id = ''

        const count = countEl?.firstChild?.textContent || '0'
        const shelf_id = shelfEl.getAttribute('data-metadata-shelf_id')

        shelfState.setShelfChildCount(shelf_id, parseInt(count))
    }
}

const getShelfStoryTotal = (shelf_id) => {
    const shelf = shelfState.getShelf(shelf_id)

    let total = shelf?.[shelfChildCountKey] || 0

    const subShelves = shelfState.getSubShelves(shelf_id) || []

    subShelves.forEach((subshelf) => {
        total += getShelfStoryTotal(subshelf.meta)
    })

    return total
}


/* ------- end of shelves.data.js ------ */


/* ######### contextMenu.dom.js ######## */

let contextMenuTemplate = null

const createContextMenuTemplate = () => {
    if (contextMenuTemplate !== null) {
        return
    }
    const ctx = [...document.querySelectorAll('body > div:not(#__next)')].find((e) => identifyContextMenu(e)?.contextMenu)
    const { contextMenu, editButton, deleteButton } = identifyContextMenu(ctx) || {}
    if (contextMenu) {
        editButton.classList.add('naie-context-edit')
        deleteButton.classList.add('naie-context-delete')
        const clone = ctx.cloneNode(true)
        clone.classList.add('naie-context-menu')

        contextMenuTemplate = clone
    }
}

const createContextMenu = (shelf_id, x, y) => {
    if (contextMenuTemplate === null) {
        return
    }

    if (activeContextMenu) {
        activeContextMenu.destroy()
    }

    const menu = contextMenuTemplate.cloneNode(true)
    const editButton = menu.querySelector('.naie-context-edit')
    const deleteButton = menu.querySelector('.naie-context-delete')

    menu.style.top = `${y}px`
    menu.style.left = `${x}px`
    menu.style.visibility = 'visible'

    const handle = NAIE.DOM.onClickOutside(
        menu,
        () => {
            if (document.body.contains(menu)) {
                document.body.removeChild(menu)
                activeContextMenu = null
            }
        },
        true,
    )

    const destroy = () => {
        handle.remove()

        if (document.body.contains(menu)) {
            document.body.removeChild(menu)
        }
        activeContextMenu = null
    }

    NAIE.DOM.addEventListenerOnce(editButton, 'click', () => {
        destroy()
        simulateContextEdit(shelf_id)
    })
    NAIE.DOM.addEventListenerOnce(deleteButton, 'click', () => {
        destroy()
        simulateContextDelete(shelf_id)
    })

    document.body.append(menu)

    activeContextMenu = { element: menu, destroy }
}

const waitForContextMenu = (isVisibleCheck, onlyNew, timeout) => {
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
                observer.disconnect()
                resolve({ contextMenu, editButton, deleteButton })
            }
        }

        const observer = new MutationObserver(callback)
        const config = { childList: true, subtree: true }

        if (isVisibleCheck) {
            config.attributeFilter = ['style']
        }

        if (!onlyNew) {
            const candidates = [...document.querySelectorAll('body > div:not(#__next)')]
            const found = candidates.find((e) => identifyContextMenu(e)?.contextMenu)
            if (found) {
                resolve(found)
                return
            }
        }

        if (timeout) {
            setTimeout(() => {
                observer.disconnect()
                resolve(null)
            }, timeout)
        }

        observer.observe(document.body, config)
    })
}

const waitForNewContextMenu = (isVisibleCheck, timeout) => {
    return waitForContextMenu(isVisibleCheck, true, timeout)
}

const identifyContextMenu = (node) => {
    let contextMenu = null
    let editButton = null
    let deleteButton = null

    if (node && node.tagName === 'DIV' && node.style) {
        const buttons = node.querySelectorAll('button[aria-disabled="false"]')

        buttons.forEach((button) => {
            const iconDiv = button.querySelector('div > div')
            if (NAIE.DOM.findElementWithMaskImage([iconDiv], ['edit', '.svg']).length > 0) {
                editButton = button
            } else if (NAIE.DOM.findElementWithMaskImage([iconDiv], ['trash', '.svg']).length > 0) {
                deleteButton = button
            }
        })

        if (editButton && deleteButton) {
            contextMenu = node
        }
    }

    return { contextMenu, editButton, deleteButton }
}

const simulateContextForShelf = async (shelf_id) => {
    await navigateToHome()

    await forcePopulateStoryList(shelf_id)

    //find shelf
    const selector = `div[data-metadata-shelf_id="${shelf_id}"]:not([data-metadata-subshelf])`
    const shelfElement = await NAIE.DOM.waitForElement(selector, 1000)

    let contextMenuPromise = waitForNewContextMenu(true)
    setTimeout(() => {
        NAIE.DOM.simulateRightClick(shelfElement)
    }, 0)

    const { contextMenu, editButton, deleteButton } = await contextMenuPromise
    if (contextMenu.style.visibility === 'hidden') {
        throw 'found wrong context meny'
    }
    contextMenu.style.visibility = 'hidden'

    return { contextMenu, editButton, deleteButton }
}

const simulateContextEdit = async (shelf_id) => {
    if (!sidebarLock) {
        sidebarLock = lockSideBar(false)
    }

    const parent_id = getMetadataObject(shelfState?.getShelf(shelf_id) || {})?.parent_id

    const { contextMenu, editButton, deleteButton } = await simulateContextForShelf(shelf_id)
    NAIE.DOM.simulateClick(editButton)

    const { modal, overlay, closeButton, ...rest } = await waitForShelfSettingsModal()

    const handle = NAIE.DOM.onClickOutside(
        modal,
        async () => {
            await NAIE.MISC.sleep(100) //sleep as no to block patch request
            await navigateToShelf(parent_id)
            navigateToShelf(parent_id) // dirty fix to ensure subshelf element is updated
            if (sidebarLock) {
                sidebarLock.unlock()
            }
        },
        true,
    )

    NAIE.DOM.addEventListenerOnce(closeButton, 'click', async () => {
        handle.remove()
        await NAIE.MISC.sleep(100) //sleep as no to block patch request
        await navigateToShelf(parent_id)
        navigateToShelf(parent_id) // dirty fix to ensure subshelf element is updated
        if (sidebarLock) {
            sidebarLock.unlock()
        }
    })
}

const simulateContextDelete = async (shelf_id) => {
    if (!sidebarLock) {
        sidebarLock = lockSideBar(false)
    }

    const parent_id = getMetadataObject(shelfState?.getShelf(shelf_id) || {})?.parent_id

    const { contextMenu, editButton, deleteButton } = await simulateContextForShelf(shelf_id)
    NAIE.DOM.simulateClick(deleteButton)

    const { modal, overlay, closeButton, ...rest } = await waitForShelfDeleteModal()

    const handle = createOverlayClickListener(
        overlay,
        modal,
        () => {
            navigateToShelf(parent_id)
            if (sidebarLock) {
                sidebarLock.unlock()
            }
        },
        true,
    )

    NAIE.DOM.addEventListenerOnce(closeButton, 'click', () => {
        handle.remove()
        navigateToShelf(parent_id)
        if (sidebarLock) {
            sidebarLock.unlock()
        }
    })
}


/* ----- end of contextMenu.dom.js ----- */


/* ############ modal.dom.js ########### */

const initModalObserver = () => {
    // Get the modal observer from NAIE services and subscribe to modal events
    const { emitter } = NAIE.SERVICES.modalObserver
    emitter.on('modal', handlePotentialShelfModal)
}

const handlePotentialShelfModal = async ({ modal, overlay }) => {
    // Skip if already handled
    if (modal.dataset['proxied']) {
        return
    }

    try {
        // Try to handle as shelf settings modal
        if (isShelfSettingsModal({ modal })) {
            handleShelfSettingsModal({ modal, overlay })
            return
        }
    } catch (error) {
        NAIE.LOGGING.getLogger().error("Error handling shelf modal:", error)
        // Not a shelf settings modal, ignore
    }
}

// Helper for handling overlay clicks
const createOverlayClickListener = (overlay, modal, callback, oneShot = false) => {
    const outsideClickListener = (event) => {
        if (!event.composedPath().includes(modal)) {
            if (oneShot) {
                removeClickListener()
            }
            callback()
        }
    }

    const removeClickListener = () => {
        document.removeEventListener('click', outsideClickListener)
    }

    overlay.addEventListener('click', outsideClickListener)

    // Return a handle to manually remove the listener
    return { remove: removeClickListener }
}

/* -------- end of modal.dom.js -------- */


/* ####### shelf-delete.modal.js ####### */

const isShelfDeleteModal = ({ modal }) => {
    const buttons = modal.firstChild?.lastChild?.querySelectorAll('button')
    return buttons?.length === 1 && modal.querySelector('button[aria-label="Close Modal"]')
}

const waitForShelfDeleteModal = async (timeout) => {
    const { waitForSpecificModal } = NAIE.SERVICES.modalObserver
    const modalData = await waitForSpecificModal(isShelfDeleteModal, timeout)

    return {
        ...modalData,
        deleteButton: modalData.modal.firstChild.lastChild.querySelector('button'),
    }
}

/* ---- end of shelf-delete.modal.js --- */


/* ###### shelf-settings.modal.js ###### */

// Predicate for identifying shelf settings modals
const isShelfSettingsModal = ({ modal }) => {
    const title = modal.querySelector('input')
    const description = modal.querySelector('textarea')
    return title && description
}

// Handle shelf settings modal event
const handleShelfSettingsModal = ({ modal, overlay }) => {
    const fields = {
        title: modal.querySelector('input'),
        description: modal.querySelector('textarea')
    }
    constructShelfSettingModal({ modal, overlay, fields })
}

// Wait for a shelf settings modal to appear
const waitForShelfSettingsModal = async (timeout) => {
    const { waitForSpecificModal } = NAIE.SERVICES.modalObserver
    const modalData = await waitForSpecificModal(isShelfSettingsModal, timeout)
    
    return {
        ...modalData,
        fields: {
            title: modalData.modal.querySelector('input'),
            description: modalData.modal.querySelector('textarea')
        }
    }
}

// Construct the shelf settings modal UI
const constructShelfSettingModal = ({ fields: { title, description }, modal, ...rest }) => {
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

    // Insert the cloned textarea into the DOM
    description.parentNode.insertBefore(clonedTextarea, description.nextSibling)

    const descriptionMetadata = parseMetadata(description.value)

    const updateNativeTextbox = (text) => {
        NAIE.DOM.setNativeValue(description, restoreMetadata(text, descriptionMetadata))
        NAIE.DOM.simulateInputEvent(description)
    }

    // Initialize the cloned textarea with sanitized content
    clonedTextarea.value = cleanMetadata(description.value)

    // Add an event listener to proxy the input
    clonedTextarea.addEventListener('input', (event) => {
        // Update the original textarea with unsanitized value
        updateNativeTextbox(event.target.value)
    })

    // insert a dropdown with shelves
    const shelfPickerTitle = getTitleHeader(title, 'Parent shelf')
    const selectableShelves = shelfState
        .getNonDescendants(descriptionMetadata.shelf_id)
        .map((s) => ({ title: s.data.title, value: s.meta }))
        .sort((a, b) => a.title.localeCompare(b.title))

    selectableShelves.unshift({ title: 'No shelf', value: 'noshelf' })
    const selectedValue =
        descriptionMetadata.parent_id && shelfState?.getMap()?.has(descriptionMetadata.parent_id)
            ? descriptionMetadata.parent_id
            : 'noshelf'
    const dropdown = NAIE.EXTENSIONS.Controls.Select.constructSelectControl(selectableShelves, selectedValue, (value) => {
        if (value === 'noshelf') {
            delete descriptionMetadata.parent_id
        } else {
            descriptionMetadata.parent_id = value
        }

        updateNativeTextbox(clonedTextarea.value)
    })
    insertShelfPicker(title, shelfPickerTitle, dropdown)

    return { ...rest, modal, fields: { title, description: clonedTextarea, rawDescription: description } }
}

// Helper functions for shelf settings modal
const getTitleHeader = (titleInputElement, newTitle) => {
    const clone = titleInputElement.previousSibling.cloneNode(true)
    clone.textContent = newTitle
    return clone
}

const insertShelfPicker = (textarea, title, dropdown) => {
    textarea.parentNode.insertBefore(dropdown, textarea.nextSibling)
    textarea.parentNode.insertBefore(title, dropdown)
}


/* --- end of shelf-settings.modal.js -- */


/* ######### shelf-image.svg.js ######## */

const shelfSvgMap = {
    0: '<svg width="134" height="59" viewBox="0 0 134 59" fill="none" xmlns="http://www.w3.org/2000/svg"><rect class="svg-color-bg1 svg-fill" y="43" width="134" height="8" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="0.5" y="43.5" width="133" height="7" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="15" y="50" width="6" height="8" rx="1" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="15.5" y="50.5" width="5" height="7" rx="0.5" stroke="#F7F7F7"></rect></svg>',
    1: '<svg width="134" height="59" viewBox="0 0 134 59" fill="none" xmlns="http://www.w3.org/2000/svg"><rect class="svg-color-bg1 svg-fill" y="43" width="134" height="8" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="0.5" y="43.5" width="133" height="7" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="15" y="50" width="6" height="8" rx="1" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="15.5" y="50.5" width="5" height="7" rx="0.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="32" y="11" width="10" height="33" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="32.5" y="11.5" width="9" height="32" rx="1.5" stroke="#F7F7F7"></rect></svg>',
    5: '<svg width="134" height="59" viewBox="0 0 134 59" fill="none" xmlns="http://www.w3.org/2000/svg"><rect class="svg-color-bg1 svg-fill" y="43" width="134" height="8" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="0.5" y="43.5" width="133" height="7" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="15" y="50" width="6" height="8" rx="1" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="15.5" y="50.5" width="5" height="7" rx="0.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="16" y="6" width="10" height="38" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="16.5" y="6.5" width="9" height="37" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="32" y="11" width="10" height="33" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="32.5" y="11.5" width="9" height="32" rx="1.5" stroke="#F7F7F7"></rect></svg>',
    10: '<svg width="134" height="59" viewBox="0 0 134 59" fill="none" xmlns="http://www.w3.org/2000/svg"><rect class="svg-color-bg1 svg-fill" y="43" width="134" height="8" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="0.5" y="43.5" width="133" height="7" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="15" y="50" width="6" height="8" rx="1" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="15.5" y="50.5" width="5" height="7" rx="0.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="16" y="6" width="10" height="38" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="16.5" y="6.5" width="9" height="37" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="32" y="11" width="10" height="33" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="32.5" y="11.5" width="9" height="32" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="69" y="8" width="14" height="36" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="69.5" y="8.5" width="13" height="35" rx="1.5" stroke="#F7F7F7"></rect></svg>',
    15: '<svg width="134" height="59" viewBox="0 0 134 59" fill="none" xmlns="http://www.w3.org/2000/svg"><rect class="svg-color-bg1 svg-fill" y="43" width="134" height="8" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="0.5" y="43.5" width="133" height="7" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="15" y="50" width="6" height="8" rx="1" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="15.5" y="50.5" width="5" height="7" rx="0.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="16" y="6" width="10" height="38" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="16.5" y="6.5" width="9" height="37" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="32" y="11" width="10" height="33" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="32.5" y="11.5" width="9" height="32" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="45" y="10" width="7" height="34" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="45.5" y="10.5" width="6" height="33" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="69" y="8" width="14" height="36" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="69.5" y="8.5" width="13" height="35" rx="1.5" stroke="#F7F7F7"></rect></svg>',
    20: '<svg width="134" height="59" viewBox="0 0 134 59" fill="none" xmlns="http://www.w3.org/2000/svg"><rect class="svg-color-bg1 svg-fill" y="43" width="134" height="8" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="0.5" y="43.5" width="133" height="7" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="15" y="50" width="6" height="8" rx="1" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="15.5" y="50.5" width="5" height="7" rx="0.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="16" y="6" width="10" height="38" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="16.5" y="6.5" width="9" height="37" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="32" y="11" width="10" height="33" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="32.5" y="11.5" width="9" height="32" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="45" y="10" width="7" height="34" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="45.5" y="10.5" width="6" height="33" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="69" y="8" width="14" height="36" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="69.5" y="8.5" width="13" height="35" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="78.3" y="15.5195" width="7" height="31.6992" rx="2" transform="rotate(-30 82 10.5)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="78.983" y="15.7025" width="6" height="30.6992" rx="1.5" transform="rotate(-30 82.683 10.683)" stroke="#F7F7F7"></rect></svg>',
    25: '<svg width="134" height="59" viewBox="0 0 134 59" fill="none" xmlns="http://www.w3.org/2000/svg"><rect class="svg-color-bg1 svg-fill" y="43" width="134" height="8" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="0.5" y="43.5" width="133" height="7" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="15" y="50" width="6" height="8" rx="1" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="15.5" y="50.5" width="5" height="7" rx="0.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="16" y="6" width="10" height="38" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="16.5" y="6.5" width="9" height="37" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="32" y="11" width="10" height="33" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="32.5" y="11.5" width="9" height="32" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="45" y="10" width="7" height="34" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="45.5" y="10.5" width="6" height="33" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="69" y="8" width="14" height="36" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="69.5" y="8.5" width="13" height="35" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="78.3" y="15.5195" width="7" height="31.6992" rx="2" transform="rotate(-30 82 10.5)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="78.983" y="15.7025" width="6" height="30.6992" rx="1.5" transform="rotate(-30 82.683 10.683)" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="57" y="19.0195" width="8" height="25" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="57.5" y="19.5195" width="7" height="24" rx="1.5" stroke="#F7F7F7"></rect></svg>',
    30: '<svg width="134" height="59" viewBox="0 0 134 59" fill="none" xmlns="http://www.w3.org/2000/svg"><rect class="svg-color-bg1 svg-fill" y="43" width="134" height="8" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="0.5" y="43.5" width="133" height="7" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="15" y="50" width="6" height="8" rx="1" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="15.5" y="50.5" width="5" height="7" rx="0.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="16" y="6" width="10" height="38" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="16.5" y="6.5" width="9" height="37" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="32" y="11" width="10" height="33" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="32.5" y="11.5" width="9" height="32" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="45" y="10" width="7" height="34" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="45.5" y="10.5" width="6" height="33" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="69" y="8" width="14" height="36" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="69.5" y="8.5" width="13" height="35" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="78.3" y="15.5195" width="7" height="31.6992" rx="2" transform="rotate(-30 82 10.5)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="78.983" y="15.7025" width="6" height="30.6992" rx="1.5" transform="rotate(-30 82.683 10.683)" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="57" y="19.0195" width="8" height="25" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="57.5" y="19.5195" width="7" height="24" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="9.06875" y="18.0078" width="8" height="25" rx="2" transform="rotate(15 9.46875 18.0078)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="9.4223" y="18.6202" width="7" height="24" rx="1.5" transform="rotate(15 9.8223 18.6202)" stroke="#F7F7F7"></rect></svg>',
    40: '<svg width="134" height="59" viewBox="0 0 134 59" fill="none" xmlns="http://www.w3.org/2000/svg"><rect class="svg-color-bg1 svg-fill" y="43" width="134" height="8" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="0.5" y="43.5" width="133" height="7" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="15" y="50" width="6" height="8" rx="1" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="15.5" y="50.5" width="5" height="7" rx="0.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="16" y="6" width="10" height="38" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="16.5" y="6.5" width="9" height="37" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="32" y="11" width="10" height="33" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="32.5" y="11.5" width="9" height="32" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="45" y="10" width="7" height="34" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="45.5" y="10.5" width="6" height="33" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="69" y="8" width="14" height="36" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="69.5" y="8.5" width="13" height="35" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="78.3" y="15.5195" width="7" height="31.6992" rx="2" transform="rotate(-30 82 10.5)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="78.983" y="15.7025" width="6" height="30.6992" rx="1.5" transform="rotate(-30 82.683 10.683)" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="57" y="19.0195" width="8" height="25" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="57.5" y="19.5195" width="7" height="24" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="9.06875" y="18.0078" width="8" height="25" rx="2" transform="rotate(15 9.46875 18.0078)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="9.4223" y="18.6202" width="7" height="24" rx="1.5" transform="rotate(15 9.8223 18.6202)" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="62.8789" width="10" height="38" rx="2" transform="rotate(85.4507 62.8789 0)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="62.4201" y="0.538083" width="9" height="37" rx="1.5" transform="rotate(85.4507 62.4201 0.538083)" stroke="#F7F7F7"></rect></svg>',
    55: '<svg width="134" height="59" viewBox="0 0 134 59" fill="none" xmlns="http://www.w3.org/2000/svg"><rect class="svg-color-bg1 svg-fill" y="43" width="134" height="8" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="0.5" y="43.5" width="133" height="7" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="15" y="50" width="6" height="8" rx="1" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="15.5" y="50.5" width="5" height="7" rx="0.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="16" y="6" width="10" height="38" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="16.5" y="6.5" width="9" height="37" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="32" y="11" width="10" height="33" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="32.5" y="11.5" width="9" height="32" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="45" y="10" width="7" height="34" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="45.5" y="10.5" width="6" height="33" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="69" y="8" width="14" height="36" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="69.5" y="8.5" width="13" height="35" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="78.3" y="15.5195" width="7" height="31.6992" rx="2" transform="rotate(-30 82 10.5)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="78.983" y="15.7025" width="6" height="30.6992" rx="1.5" transform="rotate(-30 82.683 10.683)" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="57" y="19.0195" width="8" height="25" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="57.5" y="19.5195" width="7" height="24" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="9.06875" y="18.0078" width="8" height="25" rx="2" transform="rotate(15 9.46875 18.0078)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="9.4223" y="18.6202" width="7" height="24" rx="1.5" transform="rotate(15 9.8223 18.6202)" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="62.8789" width="10" height="38" rx="2" transform="rotate(85.4507 62.8789 0)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="62.4201" y="0.538083" width="9" height="37" rx="1.5" transform="rotate(85.4507 62.4201 0.538083)" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="83" y="8.00098" width="7.75503" height="47.531" rx="2" transform="rotate(-40.1313 83 8.00098)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="83.7046" y="8.06099" width="6.75503" height="46.531" rx="1.5" transform="rotate(-40.1313 83.7046 8.06099)" stroke="#F7F7F7"></rect></svg>',
    70: '<svg width="134" height="59" viewBox="0 0 134 59" fill="none" xmlns="http://www.w3.org/2000/svg"><rect class="svg-color-bg1 svg-fill" y="43" width="134" height="8" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="0.5" y="43.5" width="133" height="7" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="15" y="50" width="6" height="8" rx="1" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="15.5" y="50.5" width="5" height="7" rx="0.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="16" y="6" width="10" height="38" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="16.5" y="6.5" width="9" height="37" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="32" y="11" width="10" height="33" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="32.5" y="11.5" width="9" height="32" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="45" y="10" width="7" height="34" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="45.5" y="10.5" width="6" height="33" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="69" y="8" width="14" height="36" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="69.5" y="8.5" width="13" height="35" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="78.3" y="15.5195" width="7" height="31.6992" rx="2" transform="rotate(-30 82 10.5)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="78.983" y="15.7025" width="6" height="30.6992" rx="1.5" transform="rotate(-30 82.683 10.683)" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="57" y="19.0195" width="8" height="25" rx="2" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="57.5" y="19.5195" width="7" height="24" rx="1.5" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="9.06875" y="18.0078" width="8" height="25" rx="2" transform="rotate(15 9.46875 18.0078)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="9.4223" y="18.6202" width="7" height="24" rx="1.5" transform="rotate(15 9.8223 18.6202)" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="62.8789" width="10" height="38" rx="2" transform="rotate(85.4507 62.8789 0)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="62.4201" y="0.538083" width="9" height="37" rx="1.5" transform="rotate(85.4507 62.4201 0.538083)" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="83" y="8.00098" width="7.75503" height="47.531" rx="2" transform="rotate(-40.1313 83 8.00098)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="83.7046" y="8.06099" width="6.75503" height="46.531" rx="1.5" transform="rotate(-40.1313 83.7046 8.06099)" stroke="#F7F7F7"></rect><rect class="svg-color-bg1 svg-fill" x="65.1523" y="20.1592" width="6.64128" height="18.4574" rx="2" transform="rotate(-157.911 65.1523 20.1592)" fill="#13152C"></rect><rect class="svg-color-textMain-20 svg-stroke" x="64.8771" y="19.5079" width="5.64128" height="17.4574" rx="1.5" transform="rotate(-157.911 64.8771 19.5079)" stroke="#F7F7F7"></rect></svg>',
}

const getShelfSVG = (value) => {
    const svgString = [...Object.entries(shelfSvgMap)].reverse().find(([k]) => value >= Number(k))?.[1] ?? shelfSvgMap[0]
    const template = document.createElement('template')
    template.innerHTML = svgString.trim() // .trim() is important to avoid issues with leading whitespace
    return template.content.firstChild
}


/* ----- end of shelf-image.svg.js ----- */


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
    if (getBreadcrumbBarEl()) {
        return
    }
    let titlebar = NAIE.NAI.findTitleBar()

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

    const crumbEl = NAIE.DOM.createElement('span', crumbStyles)
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
    template.innerHTML = svgHTML.trim()
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

            // Create breadcrumb elements
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


/* ######### homeButton.dom.js ######### */

const grabHomeButton = () => {
    const homeButtonCandidate = findHomeButton()
    if (homeButtonCandidate && homeButton !== homeButtonCandidate) {
        homeButton = homeButtonCandidate
        NAIE.DOM.addEventListenerOnce(homeButton, 'click', () => {
            activeShelf = null
        })
    }
}

const findHomeButton = () => {
    const titleBar = NAIE.NAI.findTitleBar()

    const homeButtonCandidate = titleBar?.firstElementChild?.firstElementChild

    const isHomeButton = NAIE.DOM.findElementWithMaskImage([homeButtonCandidate?.firstElementChild], ['home', '.svg']).length > 0

    if (isHomeButton) {
        return homeButtonCandidate
    }

    return null
}

const waitForHome = () => {
    return new Promise((resolve) => {
        const checkHomeButton = () => {
            const homeButton = findHomeButton()
            if (homeButton === null) {
                resolve()
            } else {
                requestAnimationFrame(checkHomeButton)
            }
        }
        checkHomeButton()
    })
}


/* ------ end of homeButton.dom.js ----- */


/* ####### newShelfButton.dom.js ####### */

const findNewShelfButton = () => {
    return document.querySelector(newShelfButtonSelector)
}

const initNewSubShelfButton = () => {
    const newShelfButton = findNewShelfButton()

    if (activeShelf !== null) {
        newShelfButton.disabled = false

        newShelfButton.style.opacity = 1

        newShelfButton.dataset['newSubShelf'] = 'true'

        NAIE.DOM.addEventListenerOnce(newShelfButton, 'click', (e) => {
            if (newShelfButton.dataset['newSubShelf'] === 'true') {
                e.preventDefault()
                createNewShelf()
            }
        })
    } else {
        newShelfButton.dataset['newSubShelf'] = false
    }
}


/* ---- end of newShelfButton.dom.js --- */


/* ########### shelves.dom.js ########## */

const getMenubarEl = () => {
    return document.querySelector(menubarSelector)
}

const getStoryListEl = () => {
    return document.querySelector(storyListSelector)
}

const AreThereShelves = () => {
    const storyList = getStoryListEl()
    return storyList && storyList.querySelectorAll(`${storyListSelector} > div:not([role])`).length > 0
}

const initStoryListObserver = (storyListEl) => {
    if (!storyListEl) {
        throw new Error('The storyListEl element is required.')
    }

    if (storyListObserver) {
        //console.log('observer already initiated, aborting...')
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

const initMenubarObserver = (menubarEl) => {
    const menubarObserverOptions = {
        childList: true,
        subtree: true,
    }

    const menubarObserverCallback = (mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const storyListEl = getStoryListEl()
                const newShelfButton = findNewShelfButton()
                if (!newShelfButton) {
                    if (storyListObserver) {
                        storyListObserver.disconnect()
                        storyListObserver = null
                    }
                    emptyStoryListFlag = true
                }
                // if there is no new shelf button, then we are on the empty story list
                if (storyListEl && emptyStoryListFlag) {
                    emptyStoryListFlag = false
                    observer.disconnect()
                    preProcessSidebar().then(() => {
                        // Resume observing after mapShelfMetadata completes
                        initStoryListObserver(storyListEl)
                        observer.observe(menubarEl, menubarObserverOptions)
                    })
                }
            }
        }
    }

    const menubarObserver = new MutationObserver(menubarObserverCallback)
    menubarObserver.observe(menubarEl, menubarObserverOptions)
}

// not used, remove?
const triggerShelfObserver = () => {
    const storyListEl = getStoryListEl()

    const hiddenDiv = document.createElement('div')
    hiddenDiv.style.display = 'none'
    hiddenDiv.setAttribute('data-metadata-processed', 'true')

    storyListEl.appendChild(hiddenDiv)

    storyListEl.removeChild(hiddenDiv)
}

const forceStoryListRefresh = async () => {
    const storyLisEl = getStoryListEl()
    if (activeShelf === null) {
        const shelf = storyLisEl.querySelector('div[data-metadata-shelf_id]')
        const shelf_id = shelf.getAttribute('data-metadata-shelf_id')
        if (shelf_id) {
            if (!sidebarLock) {
                sidebarLock = lockSideBar(true, true)
            }
            await navigateToShelf(shelf_id, false)
            await navigateToHome()
            if (sidebarLock) {
                sidebarLock.unlock()
            }
        }
    } else {
        await navigateToShelf(activeShelf)
    }
}

const forcePopulateStoryList = async (specificItemId = null, loadAllStories = false) => {
    if (!shelfState) {
        return
    }

    const totalItems = shelfState.getMap().size
    const scrollList = document.querySelector(storyListSelector)

    const scrollToEnd = () => {
        scrollList.scrollTop = scrollList.scrollHeight
    }

    const scrollToTop = () => {
        scrollList.scrollTop = 0
    }

    const getLoadedItemsCount = () => {
        return scrollList.querySelectorAll(`${storyListSelector} > div:not([role])`).length
    }

    const isSpecificItemLoaded = (itemId) => {
        return document.querySelector(`div[data-metadata-shelf_id="${itemId}"]:not([data-metadata-subshelf])`)
    }

    return new Promise((resolve, reject) => {
        let lastScrollHeight = 0

        const checkLoadedItems = () => {
            if (specificItemId) {
                if (isSpecificItemLoaded(specificItemId)) {
                    scrollToTop()
                    resolve()
                    return
                }
            } else if (loadAllStories) {
                const currentScrollHeight = scrollList.scrollHeight
                if (currentScrollHeight === lastScrollHeight) {
                    scrollToTop()
                    resolve()
                    return
                }
                lastScrollHeight = currentScrollHeight
            } else {
                if (getLoadedItemsCount() >= totalItems) {
                    scrollToTop()
                    resolve()
                    return
                }
            }

            scrollToEnd()
            setTimeout(checkLoadedItems, 50)
        }

        checkLoadedItems()
    })
}

// map metadata injected into description as data attributes on the shelf element
const mapShelfMetadata = async () => {
    const storyListDiv = getStoryListEl()

    if (!storyListDiv) {
        return Promise.reject()
    }

    // shelves do not have a role
    const childDivs = storyListDiv.querySelectorAll(`${storyListSelector} > div:not([role])`)

    const promises = []

    childDivs.forEach((div) => {
        if (div.hasAttribute('data-metadata-processed')) {
            return
        }

        const spans = div.querySelectorAll('span')

        // find metadata
        spans.forEach((span) => {
            const metadata = parseMetadata(span.textContent)

            if (!NAIE.MISC.isObjEmpty(metadata)) {
                Object.keys(metadata).forEach((key) => {
                    div.setAttribute(`data-metadata-${key}`, metadata[key])
                })

                div.setAttribute('data-metadata-processed', 'true')

                span.textContent = writeMetadata(span.textContent, {})

                // store element for cloning for subshelves
                shelfState.setShelfElement(metadata.shelf_id, div.cloneNode(true))

                NAIE.DOM.addEventListenerOnce(div, 'click', () => {
                    activeShelf = metadata.shelf_id
                })

                promises.push(NAIE.DOM.waitForElement(`[data-metadata-shelf_id="${metadata.shelf_id}"]`, 1000))
            }
        })
    })

    let result = await Promise.all(promises)

    processStoryList()

    return result
}

const processStoryList = () => {
    if (!updateInProgress) {
        updateInProgress = true
        getNumChildrenFromDom()
        updateMetadata()
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
        if (!NAIE.MISC.isObjEmpty(metadata)) {
            span.textContent = writeMetadata(span.textContent, {})
        }
    })
}

const updateMetadata = () => {
    const subShelves = document.querySelectorAll(`${storyListSelector} > div[data-metadata-shelf_id]`)
    subShelves.forEach((subShelf) => {
        const shelf_id = subShelf.getAttribute('data-metadata-shelf_id')
        try {
            const shelf = shelfState.getShelf(shelf_id)
            const parent_id = shelf?.[persistent_metadata_key]?.parent_id

            if (parent_id) {
                subShelf.setAttribute('data-metadata-parent_id', parent_id)
            }

            updateShelfEntry(subShelf, shelf.data)
        } catch (e) {
            NAIE.LOGGING.getLogger().error('metadata error', e)
        }
    })
}

const hideSubShelves = () => {
    const subShelves = document.querySelectorAll(`${storyListSelector} > div[data-metadata-parent_id]`)
    subShelves.forEach((subShelf) => {
        const parent_id = subShelf.getAttribute('data-metadata-parent_id')
        if (shelfState.getMap().has(parent_id)) {
            subShelf.style.display = 'none'
        }
    })
}

const restoreSubshelvesOfParent = (parent_id) => {
    const subShelves = document.querySelectorAll(`${storyListSelector} > div[data-metadata-parent_id="${parent_id}"]`)
    subShelves.forEach((subShelf) => {
        subShelf.style.display = 'block'
    })
}

const clearSubshelves = () => {
    const storyList = getStoryListEl()
    const subshelves = storyList.querySelectorAll('div[data-metadata-subshelf="true"]')

    subshelves.forEach((shelf) => {
        storyList.removeChild(shelf)
    })
}

const removeEmptyShelfBox = () => {
    const storyList = getStoryListEl()
    if (!storyList) {
        return
    }
    const storyElement = storyList.querySelector('div[role="button"][data-id]')

    if (!storyElement && storyList.children?.length === 1) {
        //storyList.removeChild(storyList.firstChild)
        storyList.firstChild.style.display = 'none'
    }
}

const insertSubshelves = () => {
    if (activeShelf) {
        let currentShelf = activeShelf
        let subshelves = shelfState.getSubShelves(currentShelf).sort((a, b) => b.data.title.localeCompare(a.data.title))

        if (subshelves.length > 0) {
            removeEmptyShelfBox()
        }

        let storyList = getStoryListEl()
        subshelves.forEach((subshelf) => {
            let shelf = shelfState.getShelfElement(subshelf.meta).cloneNode(true)
            let shelf_id = subshelf.meta
            shelf.style.display = 'block'
            shelf.setAttribute(`data-metadata-subshelf`, true)
            updateShelfEntry(shelf, subshelf.data)
            NAIE.DOM.addEventListenerOnce(shelf, 'click', () => {
                handleSubSubshelfClick(shelf_id)
            })
            NAIE.DOM.addEventListenerOnce(shelf, 'contextmenu', (e) => {
                e.preventDefault()
                createContextMenu(shelf_id, e.pageX, e.pageY)
            })
            storyList.prepend(shelf)
        })
        storyList.scrollTop = 0
    }
}

const updateShelfEntry = (element, data) => {
    element.id = 'tmpID'

    let titleEl = element.querySelector('#tmpID > div:first-child > span')
    let descriptionEl = element.querySelector('#tmpID > div:nth-child(2) > span')
    let countEl = element.querySelector('#tmpID > div:nth-child(3)')

    element.id = ''

    /*
    const metadata = parseMetadata(descriptionEl.textContent)

    // Update/set data annotations with the extracted metadata
    if (!NAIE.MISC.isObjEmpty(metadata)) {
        Object.keys(metadata).forEach((key) => {
            element.setAttribute(`data-metadata-${key}`, metadata[key])
        })
    }*/

    const countClone = countEl.cloneNode()
    countClone.classList.add('naie-computed-count')

    const subshelves = shelfState.getSubShelves(data.id)

    const totalShelves = getShelfStoryTotal(data.id)

    if (subshelves.length > 0) {
        const storyCount = countClone.cloneNode()
        storyCount.style.position = 'relative'
        storyCount.style.right = 'auto'
        storyCount.style.top = 'auto'
        storyCount.style.transform = 'none'

        const shelfCount = storyCount.cloneNode()
        shelfCount.style.fontSize = '0.775rem'

        countClone.style.display = 'flex'
        countClone.style.flexDirection = 'column'
        countClone.style.gap = '0.2rem'
        countClone.style.alignItems = 'end'

        storyCount.textContent = `${totalShelves} Stories`
        shelfCount.textContent = `${subshelves.length} ${subshelves.length === 1 ? 'Shelf' : 'Shelves'}`

        countClone.appendChild(storyCount)
        countClone.appendChild(shelfCount)
    } else {
        countClone.textContent = `${totalShelves} Stories`
    }

    countEl.style.display = 'none'

    element.insertBefore(countClone, element.lastChild)

    const svgImage = getShelfSVG(totalShelves)

    element.lastChild.replaceWith(svgImage)

    titleEl.textContent = data.title
    descriptionEl.textContent = writeMetadata(data.description, {})

    return element
}

const handleSubSubshelfClick = async (subSubshelfId) => {
    try {
        await navigateToShelf(subSubshelfId)
    } catch (error) {
        console.error('Error handling sub-subshelf click:', error)
    }
}

const navigateToShelf = async (shelf_id, lockSidebar = true) => {
    if (!sidebarLock && lockSidebar) {
        sidebarLock = lockSideBar()
    }

    if (activeShelf) {
        await navigateToHome()
    }

    if (shelf_id) {
        // Wait for the shelf to appear in the DOM
        const selector = `div[data-metadata-shelf_id="${shelf_id}"]:not([data-metadata-subshelf])`
        const shelfElement = await NAIE.DOM.waitForElement(selector, 1000)

        // Simulate click on the shelf
        NAIE.DOM.simulateClick(shelfElement)
    }
    setTimeout(() => {
        if (sidebarLock && lockSidebar) {
            sidebarLock.unlock()
        }
        processStoryList()
    }, 0)
}

const navigateToHome = async () => {
    const shelf_id = activeShelf

    if (shelf_id && findHomeButton()) {
        const setTimeoutPromise = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

        // avoids a race condition in event queue
        await setTimeoutPromise(0)

        NAIE.DOM.simulateClick(homeButton)
        await waitForHome()

        const selector = `div[data-metadata-shelf_id="${shelf_id}"]:not([data-metadata-subshelf])`
        await NAIE.DOM.waitForElement(selector)
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
    if (newShelfButton.dataset['newSubShelf'] !== 'true') {
        activeShelf = parent_id
        NAIE.DOM.simulateClick(newShelfButton)
    }
}

const updateShelfStateViaDescription = async (shelfElement, metadata) => {
    let contextMenuPromise = waitForNewContextMenu(true)

    setTimeout(() => {
        NAIE.DOM.simulateRightClick(shelfElement)
    }, 0)

    const { contextMenu, editButton, deleteButton } = await contextMenuPromise
    if (contextMenu.style.visibility === 'hidden') {
        throw 'found wrong context meny'
    }
    contextMenu.style.visibility = 'hidden'

    NAIE.DOM.simulateClick(editButton)
    let { modal, overlay, closeButton, fields } = await waitForShelfSettingsModal(100)

    NAIE.DOM.setNativeValue(fields.description, writeMetadata('', metadata))
    NAIE.DOM.simulateInputEvent(fields.description)

    NAIE.DOM.simulateClick(closeButton)
}

const processNewShelf = async (shelf_id) => {
    const newShelfButton = findNewShelfButton()
    newShelfButton.disabled = true

    const inSubshelf = activeShelf !== null
    let parent_id = null
    if (inSubshelf) {
        parent_id = activeShelf
        NAIE.DOM.simulateClick(homeButton)
    }

    const contextMenuPromise = waitForNewContextMenu(false, 1000)

    let newShelf = await NAIE.DOM.waitForElement(`${storyListSelector} > div:not([data-metadata-processed]):not([role]):not([data-locked-shelf])`)

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
    }

    await updateShelfStateViaDescription(newShelf, metadata)
    newShelfButton.disabled = false

    if (parent_id) {
        navigateToShelf(parent_id)
    }

    if (sidebarLock) {
        sidebarLock.unlock()
    }
}


/* ------- end of shelves.dom.js ------- */


/* ########### sidebar.dom.js ########## */

const getSidebarEl = () => {
    return document.querySelector('.menubar:not(#sidebar-lock)')
}

const lockSideBar = (showLoader = true, forceLoader = false, positional = false) => {
    const sidebar = getSidebarEl()

    const storyListEl = getStoryListEl()
    const scroll = storyListEl.scrollTop

    const clone = cloneSidebar(sidebar, scroll)

    const hideSidebarWithPosition = () => {
        sidebar.style.position = 'absolute'
        sidebar.style.left = '-1000px'
        sidebar.style.top = '-1000px'
    }

    const restoreSidebarWithPosition = () => {
        sidebar.style.removeProperty('position')
        sidebar.style.removeProperty('left')
        sidebar.style.removeProperty('top')
    }

    const hideSidebarWithDisplay = () => {
        sidebar.style.display = 'none'
    }

    const restoreSidebarWithDisplay = () => {
        sidebar.style.removeProperty('display')
    }

    const hideSidebar = positional ? hideSidebarWithPosition : hideSidebarWithDisplay
    const restoreSidebar = positional ? restoreSidebarWithPosition : restoreSidebarWithDisplay

    hideSidebar()

    const sibling = sidebar.nextSibling
    sidebar.parentNode.insertBefore(clone, sibling)

    let loaderTimeout
    let loaderShownTime = null
    let loaderElement

    const addLoader = () => {
        loaderElement = createSidebarLoader(clone)
        clone.replaceWith(loaderElement)
        loaderShownTime = Date.now()
    }

    forceLoader = NAIE.MISC.isMobileView() ? true : forceLoader

    const timeout = forceLoader ? 0 : 250

    if (showLoader) {
        loaderTimeout = setTimeout(() => {
            addLoader()
        }, timeout)
    }

    const unlock = () => {
        clearTimeout(loaderTimeout)

        const currentClone = document.getElementById('sidebar-lock')

        if (loaderShownTime && showLoader) {
            const elapsedTime = Date.now() - loaderShownTime
            const remainingTime = Math.max(500 - elapsedTime, 0)

            setTimeout(() => {
                restoreSidebar()
                if (currentClone) {
                    currentClone.remove()
                    sidebarLock = null
                }
            }, remainingTime)
        } else {
            restoreSidebar()
            if (currentClone) {
                currentClone.remove()
                sidebarLock = null
            }
        }
    }

    return { unlock }
}

const cloneSidebar = (sidebar, scrollValue = 0) => {
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
        s.setAttribute('data-locked-shelf', 'true')
    })

    const storyList = clone.querySelector('.story-list')
    storyList.scrollTop = scrollValue

    return clone
}

const createSidebarLoader = (lockedSidebar) => {
    const loaderSidebar = lockedSidebar.cloneNode(true)

    loaderSidebar.classList.add('sidebar-loader')

    while (loaderSidebar.children.length > 2) {
        loaderSidebar.removeChild(loaderSidebar.lastChild)
    }

    const container = NAIE.DOM.createElement('div', {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
    })

    const spinner = NAIE.EXTENSIONS.Loader.getSpinner() //loaderTemplate.firstChild.cloneNode(true)
    container.append(spinner)

    loaderSidebar.append(container)

    return loaderSidebar
}

/* new sidebar lock function


let sidebarLockCounter = 0;
let sidebarLock = null;

const lockSideBar = (showLoader = true, forceLoader = false, positional = false) => {
    if (!sidebarLock) {
        sidebarLockCounter = 0;
        sidebarLock = {
            unlock: null
        };
    }

    sidebarLockCounter++;

    const sidebar = getSidebarEl();
    const storyListEl = getStoryListEl();
    const scroll = storyListEl.scrollTop;
    const clone = cloneSidebar(sidebar, scroll);

    const hideSidebarWithPosition = () => {
        sidebar.style.position = 'absolute';
        sidebar.style.left = '-1000px';
        sidebar.style.top = '-1000px';
    };

    const restoreSidebarWithPosition = () => {
        sidebar.style.removeProperty('position');
        sidebar.style.removeProperty('left');
        sidebar.style.removeProperty('top');
    };

    const hideSidebarWithDisplay = () => {
        sidebar.style.display = 'none';
    };

    const restoreSidebarWithDisplay = () => {
        sidebar.style.removeProperty('display');
    };

    const hideSidebar = positional ? hideSidebarWithPosition : hideSidebarWithDisplay;
    const restoreSidebar = positional ? restoreSidebarWithPosition : restoreSidebarWithDisplay;

    hideSidebar();

    const sibling = sidebar.nextSibling;
    sidebar.parentNode.insertBefore(clone, sibling);

    let loaderTimeout: number | undefined;
    let loaderShownTime: number | null = null;
    let loaderElement: HTMLElement | null = null;

    const addLoader = () => {
        loaderElement = createSidebarLoader(clone);
        clone.replaceWith(loaderElement);
        loaderShownTime = Date.now();
    };

    forceLoader = isMobileView() ? true : forceLoader;
    const timeout = forceLoader ? 0 : 250;

    if (showLoader) {
        loaderTimeout = window.setTimeout(addLoader, timeout);
    }

    const unlock = () => {
        if (sidebarLockCounter > 0) {
            sidebarLockCounter--;
        }

        if (sidebarLockCounter === 0) {
            clearTimeout(loaderTimeout);

            const currentClone = document.getElementById('sidebar-lock');

            if (loaderShownTime && showLoader) {
                const elapsedTime = Date.now() - loaderShownTime;
                const remainingTime = Math.max(500 - elapsedTime, 0);

                setTimeout(() => {
                    restoreSidebar();
                    if (currentClone) {
                        currentClone.remove();
                    }
                    sidebarLock = null;
                }, remainingTime);
            } else {
                restoreSidebar();
                if (currentClone) {
                    currentClone.remove();
                }
                sidebarLock = null;
            }
        }
    };

    sidebarLock.unlock = unlock;
    return sidebarLock;
};

 */


/* ------- end of sidebar.dom.js ------- */


/* ########## delete.hooks.js ########## */

/**
 * Hooks for handling DELETE requests to the shelves API endpoint
 */

const registerShelfDeleteHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'shelf-delete',
        priority: 10,
        urlPattern: '/user/objects/shelf',
        methods: ['DELETE'],
        modifyRequest: async (request) => {
            const remoteId = request.url.split('/').pop();

            if (shelfState) {
                try {
                    const shelf = shelfState.getShelfByRemoteId(remoteId);
                    const parent = getMetadataObject(shelf)?.parent_id;
                    shelfState.deleteShelf(shelf.meta);

                    if (activeShelf === null) {
                        // we are deleting from the home shelf, manually restore hidden children of deleted parent
                        restoreSubshelvesOfParent(shelf.meta);
                    }

                    // we know delete sends us back to home if we're not, correct activeShelf to reflect that
                    activeShelf = null;

                    navigateToShelf(parent);
                    if (sidebarLock) {
                        sidebarLock.unlock();
                    }
                } catch (e) {
                    console.error('Error in delete request hook:', e);
                }
            }

            return {
                type: 'request',
                value: request
            };
        }
    });
};


/* ------- end of delete.hooks.js ------ */


/* ############ get.hooks.js ########### */

/**
 * Hooks for handling GET requests to the shelves API endpoint
 */

const registerShelfGetHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'shelf-get-all',
        priority: 10,
        urlPattern: '/user/objects/shelf',
        methods: ['GET'],
        modifyResponse: async (response, request) => {
            const copy = response.clone();
            let data = await copy.json();
            shelfState = createShelfState(buildShelfMap(data.objects));
            const modifiedData = { objects: InjectShelfTransientMeta(data.objects) };
            
            return new Response(JSON.stringify(modifiedData), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
            });
        }
    });
};


/* -------- end of get.hooks.js -------- */


/* ########### patch.hooks.js ########## */

/**
 * Hooks for handling PATCH requests to the shelves API endpoint
 */

const registerShelfPatchHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'shelf-patch',
        priority: 10,
        urlPattern: '/user/objects/shelf',
        methods: ['PATCH'],
        modifyRequest: async (request) => {
            const options = NAIE.NETWORK.getFetchOptions(request)
            const body = JSON.parse(options.body)
            const data = JSON.parse(NAIE.MISC.decodeBase64(body.data))
            const shelf_id = body.meta

            // Strip transient metadata from description
            data.description = stripTransientMetadataFromText(data.description)
            body.data = NAIE.MISC.encodeBase64(JSON.stringify(data))
            options.body = JSON.stringify(body)

            // Update shelf state
            if (shelfState) {
                try {
                    shelfState.upsertShelf(shelf_id, decodeShelf(body))
                    processStoryList()
                } catch (e) {
                    console.error('Error updating shelf state:', e)
                }
            }

            return {
                type: 'request',
                value: new Request(request.url, options),
            }
        },
        modifyResponse: async (response, request) => {
            const copy = response.clone()
            let shelf = await copy.json()

            // Update shelf state with response data
            if (shelfState) {
                try {
                    shelfState.upsertShelf(shelf.meta, decodeShelf(shelf))
                } catch (e) {
                    // Silently handle error as per original implementation
                }
            }

            // Inject transient metadata and create modified response
            const modifiedData = InjectShelfTransientMetaSingle(shelf)

            // Force refresh story list after patch
            forceStoryListRefresh()

            return new Response(JSON.stringify(modifiedData), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
            })
        },
    })
}


/* ------- end of patch.hooks.js ------- */


/* ############ put.hooks.js ########### */

/**
 * Hooks for handling PUT requests to the shelves API endpoint
 */

// Track active PUT requests to handle double-PUT pattern
const activePutShelfRequests = new Map()

/**
 * Register hooks for PUT operations on the shelves endpoint
 */
const registerShelfPutHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'shelf-put',
        priority: 10,
        urlPattern: '/user/objects/shelf',
        methods: ['PUT'],
        modifyRequest: async (request) => {
            const options = NAIE.NETWORK.getFetchOptions(request)
            const body = JSON.parse(options.body)
            const data = JSON.parse(NAIE.MISC.decodeBase64(body.data))
            const shelf_id = body.meta

            // Handle first PUT request
            if (!activePutShelfRequests.has(shelf_id)) {
                activePutShelfRequests.set(shelf_id, 1)
                processNewShelf(shelf_id) // This will trigger a new PUT request
                return {
                    type: 'response',
                    value: new Response('{}', {
                        status: 418,
                        statusText: 'Blocked by client',
                    }),
                }
            }

            // Process second PUT request (the one triggered by processNewShelf)
            data.description = stripTransientMetadataFromText(data.description)
            body.data = NAIE.MISC.encodeBase64(JSON.stringify(data))
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

            // not sure why this is here but likely necessary due to some race condition
            createContextMenuTemplate()

            return {
                type: 'request',
                value: new Request(request.url, options),
            }
        },
        modifyResponse: async (response, request) => {
            const copy = response.clone()
            let shelf = await copy.json()

            if (shelfState) {
                try {
                    shelfState.upsertShelf(shelf.meta, decodeShelf(shelf))
                } catch (e) {
                    // Silently handle error as per original implementation
                }
            }

            const modifiedData = InjectShelfTransientMetaSingle(shelf)

            return new Response(JSON.stringify(modifiedData), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
            })
        },
    })
}


/* -------- end of put.hooks.js -------- */


/* ########## shelves.hooks.js ######### */

/**
 * Main registration point for all shelf-related hooks
 */

const registerShelfHooks = () => {
    registerShelfGetHooks();
    registerShelfPutHooks();
    registerShelfPatchHooks();
    registerShelfDeleteHooks();
};


/* ------ end of shelves.hooks.js ------ */


/* #### init-observers.preflight.js #### */

const initGlobalObservers = () => {
    initModalObserver()
    initMenubarObserver(getMenubarEl())
    const storyList = getStoryListEl()
    if (storyList) {
        initStoryListObserver(storyList)
    }
}


/* - end of init-observers.preflight.js  */


/* ############ preflight.js ########### */

let preflightRun = false
const preflight = async () => {
    if (preflightRun) {
        return
    }
    preflightRun = true

    try {
        const registerSubshelvesHooks = () => {
            // Early stage - Basic UI elements and controls
            /*NAIE.PREFLIGHT.registerHook(
                'early',
                'subshelves-network',
                10,
                async () => {
                    initializeNetworkHooks()
                }
            )*/

            // Main stage - Core functionality
            NAIE.PREFLIGHT.registerHook('main', 'subshelves-core', 10, async () => {
                //await NAIE.DOM.waitForElement(menubarSelector)
                await NAIE.DOM.waitForElement(storyListSelector)
                if (!sidebarLock) {
                    sidebarLock = lockSideBar(true, true, true)
                    await NAIE.MISC.sleep(100)
                }
                await preProcessSidebar()
                await initGlobalObservers() // implement core
            })

            // Late stage - Final setup
            NAIE.PREFLIGHT.registerHook('late', 'subshelves-final', 10, async () => {
                if (AreThereShelves()) {
                    createContextMenuTemplate()
                }
                if (sidebarLock) {
                    sidebarLock.unlock()
                }
                NAIE.SERVICES.statusIndicator.displayMessage('Subshelves initialized')
            })
        }

        registerSubshelvesHooks()
    } catch (e) {
        console.error('Failed to register subshelves preflight hooks:', e)
        throw new Error('Subshelves preflight initialization failed!')
    }
}


/* -------- end of preflight.js -------- */


/* #### preprocess-dom.preflight.js #### */

const preProcessSidebar = async () => {
    createBreadcrumbBar()
    await forcePopulateStoryList(null, true)
    await mapShelfMetadata()
}


/* - end of preprocess-dom.preflight.js  */


/* ########### shelf.state.js ########## */

const createShelfState = (shelfData) => {
    const shelfDataMap = shelfData

    const getMap = () => shelfDataMap

    const upsertShelf = (shelfId, shelfData) => {
        if (shelfDataMap.has(shelfId)) {
            const element = shelfDataMap.get(shelfId)[shelfElementKey]
            updateShelf(shelfId, { ...shelfData, [shelfElementKey]: element })
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
        return Array.from(shelfDataMap.values()).find((s) => s.id === remoteId)
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

    const setShelfChildCount = (shelfId, count) => {
        const shelfData = shelfDataMap.get(shelfId)
        if (shelfData !== undefined) {
            shelfDataMap.set(shelfId, { ...shelfData, [shelfChildCountKey]: count })
        }
    }

    const getShelfChildCount = (shelfId) => {
        const shelfData = shelfDataMap.get(shelfId)
        if (shelfData) {
            return shelfData[shelfChildCountKey]
        }
        return null
    }

    const getSubShelves = (parentId) => {
        return Array.from(shelfDataMap.values()).filter((s) => getMetadataObject(s)?.parent_id === parentId)
    }

    const getNonDescendants = (id) => {
        const result = []
        const descendants = new Set()
        const stack = id ? [id] : []

        while (stack.length > 0) {
            const currentId = stack.pop()
            descendants.add(currentId)

            for (const [key, value] of shelfDataMap.entries()) {
                const { parent_id } = getMetadataObject(value) || {}
                if (parent_id === currentId) {
                    stack.push(key)
                }
            }
        }

        for (const [key, value] of shelfDataMap.entries()) {
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
        getShelfChildCount,
        setShelfChildCount,
    }
}


/* ------- end of shelf.state.js ------- */


/* ########### network.mod.js ########## */

/**
 * Network module for handling API requests
 * Registers hooks with NAIE.NETWORK for intercepting and modifying requests/responses
 */

const initializeNetworkHooks = () => {
    // Initialize hooks for each endpoint group
    registerShelfHooks();
    
    // Future endpoint groups can be initialized here
    // initializeStoryHooks();
    // initializeContextHooks();
};


/* ------- end of network.mod.js ------- */



// Check if the current path is /stories before initializing
if (wRef.location.pathname.startsWith('/stories')) {
    scriptInit = false
    init()
}

