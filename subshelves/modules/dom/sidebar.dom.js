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
