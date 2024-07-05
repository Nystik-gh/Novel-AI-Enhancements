const preShelfDelete = (request) => {
    const options = getFetchOptions(request)
    const remoteId = request.url.split('/').pop()

    if (shelfState) {
        try {
            const shelf = shelfState.getShelfByRemoteId(remoteId)
            console.log('delete id', shelf.meta)
            const parent = getMetadataObject(shelf)?.parent_id
            shelfState.deleteShelf(shelf.meta)
            // bypass navigate home
            activeShelf = null
            //navigate to parent shelf
            navigateToShelf(parent)
        } catch (e) {}
    }

    return options
}
