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

    forceLoader = isMobileView() ? true : forceLoader

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
