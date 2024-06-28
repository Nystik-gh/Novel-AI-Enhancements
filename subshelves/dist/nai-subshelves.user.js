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

const storyListSelector = '.story-list'
const filterButtonSelector = 'button[aria-label="Open Sort Settings"]' // used to find the title bar
const breadcrumbsBarSelector = '#breadcrumbs-bar' // created by this script

// State vars
let activeShelf = null
let storyListObserver = null
let shelfState = null

// elements
let homeButton = null

const init = () => {
    loadXhookScript()

    document.addEventListener('DOMContentLoaded', () => {
        // Process story-list if it exists initially

        waitForElement(storyListSelector).then((storyList) => {
            console.log('story list loaded', storyList)
            mapShelfMetadata()
            initStoryListObserver(storyList)
            createBreadcrumbBar()
        })
    })
}

/* ############## state.js ############# */

const createShelfState = (shelfData) => {
    const shelfDataMap = shelfData

    const getMap = () => shelfDataMap

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

    const getSubShelves = (parentId) => {
        return shelfDataMap.values().filter((s) => getMetadataObject(s)?.parent_id === parentId)
    }

    return {
        getMap,
        insertShelf,
        getShelf,
        updateShelf,
        deleteShelf,
        setShelfElement,
        getShelfElement,
        getSubShelves,
    }
}


/* ---------- end of state.js ---------- */


/* ############## utils.js ############# */

const decodeBase64 = (str) => {
    return atob(str)
}

const encodeBase64 = (str) => {
    return btoa(str)
}

const isObjEmpty = (obj) => {
    for (const prop in obj) {
        if (Object.hasOwn(obj, prop)) {
            return false
        }
    }

    return true
}

const simulateClick = (element) => {
    if (element) {
        element.click()
    }
}

const waitForElement = (selector) => {
    return new Promise((resolve) => {
        const element = document.querySelector(selector)
        if (element) {
            resolve(element)
        } else {
            const observer = new MutationObserver((mutationsList, observer) => {
                const element = document.querySelector(selector)
                if (element) {
                    observer.disconnect()
                    resolve(element)
                }
            })

            observer.observe(document.body, { childList: true, subtree: true, attributes: true })
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

const getStoryListEl = () => {
    return document.querySelector(storyListSelector)
}

const getBreadcrumbBarEl = () => {
    return document.querySelector(breadcrumbsBarSelector)
}

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

    const maskImageValue = homeButtonCandidate?.firstElementChild
        ? window.getComputedStyle(homeButtonCandidate?.firstElementChild).getPropertyValue('mask-image')
        : null

    // Check if mask-image property contains 'home'
    if (
        homeButtonCandidate &&
        homeButtonCandidate.tagName === 'DIV' &&
        maskImageValue.includes('home') &&
        maskImageValue.includes('.svg')
    ) {
        // Log the found home button
        console.log('Found home button:', homeButtonCandidate)

        return homeButtonCandidate
    }

    return null
}

const findTitleBar = () => {
    // Find the button with aria-label="Open Sort Settings"
    const sortSettingsButton = document.querySelector(filterButtonSelector)

    // manually traverse dom to expected home button
    const titleBarCandidate = sortSettingsButton?.parentNode?.parentNode

    if (titleBarCandidate && titleBarCandidate.tagName === 'DIV') {
        console.log('Found title bar:', titleBarCandidate)
        return titleBarCandidate
    }

    return null
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

const makeBreadcrumbs = (id, map) => {
    const breadcrumbs = []
    let currentId = id

    while (currentId) {
        const obj = map.get(currentId)
        if (obj) {
            breadcrumbs.unshift(obj) // Add the object to the beginning of the array
            currentId = getMetadataObject(obj).parent_id
        } else {
            break // Break loop if object with currentId is not found
        }
    }

    return breadcrumbs
}


/* ---------- end of utils.js ---------- */


/* ############ metadata.js ############ */

const metadataStartDelimiter = ';---'
const metadataEndDelimiter = '---;'

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
        let metadataBlock = `${startDelimiter}\n`
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

const clearTransientMetadata = () => {}


/* --------- end of metadata.js -------- */


/* ######### data-transform.js ######### */

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

    console.log('injetedMeta', decoded)

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

    console.log(itemMap)

    return itemMap
}


/* ------ end of data-transform.js ----- */


/* ########## dom-transform.js ######### */

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
    }

    const observerCallback = (mutationsList, observer) => {
        // Trigger mapShelfMetadata when mutations indicate changes
        storyListObserver.disconnect()
        grabHomeButton()
        mapShelfMetadata().then(() => {
            // Resume observing after mapShelfMetadata completes
            observer.observe(storyListEl, observerOptions)
        })
    }

    storyListObserver = new MutationObserver(observerCallback)
    storyListObserver.observe(storyListEl, observerOptions)
}

const mapShelfMetadata = async () => {
    console.log('mapShelfMetadata')

    // Find the div with class "story-list"
    const storyListDiv = getStoryListEl()

    // Check if the div exists before proceeding
    if (!storyListDiv) {
        return Promise.resolve() // Resolve immediately if storyListDiv is not found
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

                promises.push(waitForElement(`[data-metadata-shelf_id="${metadata.shelf_id}"]`))
            }
        })
    })

    // Return a promise that resolves when all waitForElement promises are resolved
    let result = await Promise.all(promises)

    hideSubShelves()
    insertSubshelves()
    insertBreadcrumbs(activeShelf)
    toggleBreadcrumbBar()

    return result
}

const hideSubShelves = () => {
    const subShelves = document.querySelectorAll(`${storyListSelector} > div[data-metadata-parent_id]`)
    subShelves.forEach((subShelf) => {
        subShelf.style.display = 'none'
    })
}

const insertSubshelves = () => {
    console.log('inserting subshelves')

    if (activeShelf) {
        let currentShelf = activeShelf
        let subshelves = shelfState.getSubShelves(currentShelf)
        console.log('children', subshelves)
        let storyList = getStoryListEl()
        subshelves.forEach((subshelf) => {
            let shelf = shelfState.getShelfElement(subshelf.meta).cloneNode(true)
            let shelf_id = subshelf.meta
            console.log('added shelf with id ', shelf_id)
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

const createCrumb = (title, onClick) => {
    const crumbEl = document.createElement('span')
    crumbEl.textContent = title
    crumbEl.style.whiteSpace = 'nowrap'
    if (onClick) {
        crumbEl.style.cursor = 'pointer'
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

            console.log('crumbData', crumbData)

            const homeCrumb = createCrumb('Home', () => {
                simulateClick(homeButton)
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

const handleSubSubshelfClick = async (subSubshelfId) => {
    try {
        // Simulate click on home button
        console.log('clicking home')
        simulateClick(homeButton)

        // Wait for the shelf to appear in the DOM
        console.log('waiting for', `div[data-metadata-shelf_id="${subSubshelfId}"]:not([data-metadata-subshelf])`)
        const selector = `div[data-metadata-shelf_id="${subSubshelfId}"]:not([data-metadata-subshelf])`
        const shelfElement = await waitForElement(selector)

        console.log('clicking', `div[data-metadata-shelf_id="${subSubshelfId}"]`)
        // Simulate click on the shelf
        simulateClick(shelfElement)
    } catch (error) {
        console.error('Error handling sub-subshelf click:', error)
    }
}


/* ------ end of dom-transform.js ------ */


/* ############## xhook.js ############# */

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
        const raw_response = await nativeFetch(request.url, fetchOptions)

        const response = await postRequestHandler(request, raw_response)

        callback(response)
    } catch (error) {
        console.error('Error fetching:', error)
    }
}

const getFetchOptions = (request) => {
    return {
        method: request.method,
        headers: request.headers,
        body: request.body,
        timeout: request.timeout,
        credentials: request.withCredentials ? 'include' : 'same-origin',
    }
}

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
                // Add your delete logic here
                break
            default:
                return response
        }
    } else {
        return response
    }
}

const preRequestHandlers = (request) => {
    const baseShelfUrl = 'https://api.novelai.net/user/objects/shelf'
    const method = request.method?.toLowerCase()

    if (request.url.startsWith(baseShelfUrl)) {
        switch (method) {
            case 'patch':
                return preShelfPatch(request)
            case 'delete':
                return getFetchOptions(request)
            default:
                return getFetchOptions(request)
        }
    } else {
        return getFetchOptions(request)
    }
}

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

const postShelfPut = async (response) => {
    const copy = response.clone()
    let shelf = await copy.json()

    console.log(shelf)
    console.log('state', shelfState.getMap())
    const modifiedData = InjectShelfMetaSingle(shelf)

    const modifiedText = JSON.stringify(modifiedData)
    const modifiedResponse = new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    })

    return modifiedResponse
}

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


/* ---------- end of xhook.js ---------- */



init()

