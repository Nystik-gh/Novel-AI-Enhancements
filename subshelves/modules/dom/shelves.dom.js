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

            if (!isObjEmpty(metadata)) {
                Object.keys(metadata).forEach((key) => {
                    div.setAttribute(`data-metadata-${key}`, metadata[key])
                })

                div.setAttribute('data-metadata-processed', 'true')

                span.textContent = writeMetadata(span.textContent, {})

                // store element for cloning for subshelves
                shelfState.setShelfElement(metadata.shelf_id, div.cloneNode(true))

                addEventListenerOnce(div, 'click', () => {
                    activeShelf = metadata.shelf_id
                })

                promises.push(waitForElement(`[data-metadata-shelf_id="${metadata.shelf_id}"]`, 1000))
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
        if (!isObjEmpty(metadata)) {
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
            addEventListenerOnce(shelf, 'click', () => {
                handleSubSubshelfClick(shelf_id)
            })
            addEventListenerOnce(shelf, 'contextmenu', (e) => {
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
        const shelfElement = await waitForElement(selector, 1000)

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

        simulateClick(homeButton)
        await waitForHome()

        const selector = `div[data-metadata-shelf_id="${shelf_id}"]:not([data-metadata-subshelf])`
        await waitForElement(selector)
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
