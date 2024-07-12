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

const triggerShelfObserver = () => {
    console.log('trigger story list observer')
    const storyListEl = getStoryListEl()
    // Create a hidden div element
    const hiddenDiv = document.createElement('div')
    hiddenDiv.style.display = 'none'
    hiddenDiv.setAttribute('data-metadata-processed', 'true')

    // Append the hidden div to storyListEl to trigger the observer
    storyListEl.appendChild(hiddenDiv)

    // Clean up by removing the hidden div
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

const forcePopulateStoryList = async (specificItemId = null) => {
    console.log('forcePopulateStoryList')
    if (!shelfState) {
        return
    }

    const totalItems = shelfState.getMap().size
    const scrollList = document.querySelector(storyListSelector)

    // Helper function to scroll to the bottom of the list
    const scrollToEnd = () => {
        scrollList.scrollTop = scrollList.scrollHeight
    }

    const scrollToTop = () => {
        scrollList.scrollTop = 0
    }

    // Helper function to get the number of currently loaded items
    const getLoadedItemsCount = () => {
        return scrollList.querySelectorAll(`${storyListSelector} > div:not([role])`).length // Adjust the selector to match the items
    }

    const isSpecificItemLoaded = (itemId) => {
        return document.querySelector(`div[data-metadata-shelf_id="${itemId}"]:not([data-metadata-subshelf])`)
    }

    return new Promise((resolve, reject) => {
        const checkLoadedItems = () => {
            if (specificItemId) {
                if (isSpecificItemLoaded(specificItemId)) {
                    console.log(`Item with ID ${specificItemId} is loaded.`)
                    scrollToTop()
                    resolve()
                    return
                }
            } else {
                if (getLoadedItemsCount() >= totalItems) {
                    console.log('All items are loaded.')
                    scrollToTop()
                    resolve()
                    return
                }
            }

            console.log('scrolling')
            scrollToEnd()
            setTimeout(checkLoadedItems, 50)
        }

        checkLoadedItems()
    })
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
        if (!isObjEmpty(metadata)) {
            span.textContent = writeMetadata(span.textContent, {})
        }
    })
}

const updateMetadata = () => {
    const subShelves = document.querySelectorAll(`${storyListSelector} > div[data-metadata-shelf_id]`)
    console.log('metadata subshelves', subShelves)
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
            console.log('metadata error', e)
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
    console.log('restoring subshelves', subShelves)
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

const insertSubshelves = () => {
    console.log('insertSubshelves', shelfState.getMap())
    if (activeShelf) {
        let currentShelf = activeShelf
        let subshelves = shelfState.getSubShelves(currentShelf).sort((a, b) => b.data.title.localeCompare(a.data.title))

        let storyList = getStoryListEl()
        subshelves.forEach((subshelf) => {
            let shelf = shelfState.getShelfElement(subshelf.meta).cloneNode(true)
            let shelf_id = subshelf.meta
            shelf.style.display = 'block'
            shelf.setAttribute(`data-metadata-subshelf`, true)
            updateShelfEntry(shelf, subshelf.data)
            addEventListenerOnce(shelf, 'click', () => {
                console.log('clicked', shelf_id)
                handleSubSubshelfClick(shelf_id)
            })
            addEventListenerOnce(shelf, 'contextmenu', (e) => {
                e.preventDefault()
                console.log('onContextMenu', shelf_id)
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
    // Parse metadata from description
    const metadata = parseMetadata(descriptionEl.textContent)

    // Update/set data annotations with the extracted metadata
    if (!isObjEmpty(metadata)) {
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
    //console.log('updating data', data, totalStories)

    element.insertBefore(countClone, element.lastChild)

    const svgImage = getShelfSVG(totalShelves)

    element.lastChild.replaceWith(svgImage)

    // Update the content of the elements
    titleEl.textContent = data.title
    descriptionEl.textContent = writeMetadata(data.description, {})
    //countEl.textContent = totalStories

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

const navigateToShelf = async (shelf_id, lockSidebar = true) => {
    if (!sidebarLock && lockSidebar) {
        sidebarLock = lockSideBar()
    }

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
        console.log('try navigate home', shelf_id, homeButton)

        simulateClick(homeButton)
        await waitForHome()
        //await forcePopulateStoryList(shelf_id) //not sure if necessary and is detrimental to performance
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
    let contextMenuPromise = waitForNewContextMenu(true)

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

    const contextMenuPromise = waitForNewContextMenu(false, 1000)

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
