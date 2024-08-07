const preShelfDelete = (request) => {
    const options = getFetchOptions(request)
    const remoteId = request.url.split('/').pop()

    if (shelfState) {
        try {
            /*if (!sidebarLock) {
                sidebarLock = lockSideBar()
            }*/
            const shelf = shelfState.getShelfByRemoteId(remoteId)
            const parent = getMetadataObject(shelf)?.parent_id
            shelfState.deleteShelf(shelf.meta)

            if (activeShelf === null) {
                // we are deleting from the home shelf, manually restore hidden children of deleted parent
                restoreSubshelvesOfParent(shelf.meta)
            }

            // we know delete sends us back to home if we're not, correct activeShelf to reflect that
            activeShelf = null

            navigateToShelf(parent)
            if (sidebarLock) {
                sidebarLock.unlock()
            }

            /*setTimeout(async () => {
                await 
            }, 100)*/
        } catch (e) {}
    }

    return options
}
