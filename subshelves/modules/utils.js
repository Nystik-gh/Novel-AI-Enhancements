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
