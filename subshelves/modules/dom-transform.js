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

const manuallyMapShelfMetadata = async () => {}

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
