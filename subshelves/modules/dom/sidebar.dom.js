const getSidebarEl = () => {
    return document.querySelector('.menubar:not(#sidebar-lock)')
}

const lockSideBar = (showLoader = true, forceLoader = false) => {
    console.log('locking sidebar')
    const sidebar = getSidebarEl()

    const clone = cloneSidebar(sidebar)

    sidebar.style.display = 'none'

    const sibling = sidebar.nextSibling
    sidebar.parentNode.insertBefore(clone, sibling)

    let loaderTimeout
    let loaderShownTime = null
    let loaderElement

    const addLoader = () => {
        loaderElement = createSidebarLoader(clone)
        console.log('sidebarLoader', loaderElement)
        clone.replaceWith(loaderElement)
        loaderShownTime = Date.now()
    }

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
                sidebar.style.removeProperty('display')
                if (currentClone) {
                    currentClone.remove()
                    sidebarLock = null
                    console.log('sidebar unlocked')
                }
            }, remainingTime)
        } else {
            sidebar.style.removeProperty('display')
            if (currentClone) {
                currentClone.remove()
                sidebarLock = null
                console.log('sidebar unlocked')
            }
        }
    }

    return { unlock }
}

const cloneSidebar = (sidebar) => {
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

    return clone
}

const createSidebarLoader = (lockedSidebar) => {
    const loaderSidebar = lockedSidebar.cloneNode(true)

    loaderSidebar.classList.add('sidebar-loader')

    while (loaderSidebar.children.length > 2) {
        loaderSidebar.removeChild(loaderSidebar.lastChild)
    }

    const container = createElement('div', {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
    })

    const spinner = loaderTemplate.firstChild.cloneNode(true)
    container.append(spinner)

    loaderSidebar.append(container)

    return loaderSidebar
}
