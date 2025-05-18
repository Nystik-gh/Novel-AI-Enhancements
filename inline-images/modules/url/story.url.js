const getStoryIdFromUrl = () => {
    const urlParams = new URLSearchParams(wRef.location.search)
    return urlParams.get('id')
}

const handleUrlChange = () => {
    const new_id = getStoryIdFromUrl()

    if (new_id) {
        currentStoryId = new_id
    }

    console.log('current id', currentStoryId)
}

const setupUrlChangeListener = () => {
    // Create URL change observer using both popstate and pushstate
    wRef.addEventListener('popstate', handleUrlChange)

    // Intercept history.pushState
    const originalPushState = history.pushState
    history.pushState = function () {
        originalPushState.apply(this, arguments)
        handleUrlChange()
    }

    // Intercept history.replaceState
    const originalReplaceState = history.replaceState
    history.replaceState = function () {
        originalReplaceState.apply(this, arguments)
        handleUrlChange()
    }

    // Also watch for hash changes (just in case)
    wRef.addEventListener('hashchange', handleUrlChange)

    // Initial check
    handleUrlChange()
}
