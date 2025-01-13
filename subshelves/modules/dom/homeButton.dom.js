const grabHomeButton = () => {
    const homeButtonCandidate = findHomeButton()
    if (homeButtonCandidate && homeButton !== homeButtonCandidate) {
        homeButton = homeButtonCandidate
        NAIE.DOM.addEventListenerOnce(homeButton, 'click', () => {
            activeShelf = null
        })
    }
}

const findHomeButton = () => {
    const titleBar = NAIE.NAI.findTitleBar()

    const homeButtonCandidate = titleBar?.firstElementChild?.firstElementChild

    const isHomeButton = NAIE.DOM.findElementWithMaskImage([homeButtonCandidate?.firstElementChild], ['home', '.svg']).length > 0

    if (isHomeButton) {
        return homeButtonCandidate
    }

    return null
}

const waitForHome = () => {
    return new Promise((resolve) => {
        const checkHomeButton = () => {
            const homeButton = findHomeButton()
            if (homeButton === null) {
                resolve()
            } else {
                requestAnimationFrame(checkHomeButton)
            }
        }
        checkHomeButton()
    })
}
