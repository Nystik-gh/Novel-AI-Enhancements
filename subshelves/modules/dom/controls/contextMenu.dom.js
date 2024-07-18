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

    const handle = OnClickOutside(
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

    addEventListenerOnce(editButton, 'click', () => {
        destroy()
        simulateContextEdit(shelf_id)
    })
    addEventListenerOnce(deleteButton, 'click', () => {
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

const simulateContextForShelf = async (shelf_id) => {
    await navigateToHome()

    await forcePopulateStoryList(shelf_id)

    //find shelf
    const selector = `div[data-metadata-shelf_id="${shelf_id}"]:not([data-metadata-subshelf])`
    const shelfElement = await waitForElement(selector, 1000)

    let contextMenuPromise = waitForNewContextMenu(true)
    setTimeout(() => {
        simulateRightClick(shelfElement)
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
    simulateClick(editButton)

    const { modal, overlay, closeButton, ...rest } = await waitForShelfSettingsModal()

    const handle = OnClickOutside(
        modal,
        async () => {
            await sleep(100) //sleep as no to block patch request
            await navigateToShelf(parent_id)
            navigateToShelf(parent_id) // dirty fix to ensure subshelf element is updated
            if (sidebarLock) {
                sidebarLock.unlock()
            }
        },
        true,
    )

    addEventListenerOnce(closeButton, 'click', async () => {
        handle.remove()
        await sleep(100) //sleep as no to block patch request
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
    simulateClick(deleteButton)

    const { modal, overlay, closeButton, ...rest } = await waitForShelfDeleteModal()

    const handle = OverlayClickListener(
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

    addEventListenerOnce(closeButton, 'click', () => {
        handle.remove()
        navigateToShelf(parent_id)
        if (sidebarLock) {
            sidebarLock.unlock()
        }
    })
}
