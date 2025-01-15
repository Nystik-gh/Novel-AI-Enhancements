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
