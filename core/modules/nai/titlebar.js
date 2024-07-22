const nai_findTitleBar = () => {
    // Find the button with aria-label="Open Sort Settings"
    const sortSettingsButton = document.querySelector(filterButtonSelector)

    // manually traverse dom to expected home button
    const titleBarCandidate = sortSettingsButton?.parentNode?.parentNode

    if (titleBarCandidate && titleBarCandidate.tagName === 'DIV') {
        return titleBarCandidate
    }

    return null
}
