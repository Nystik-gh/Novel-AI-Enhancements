const activePutShelfRequests = new Map()

const preShelfPut = (request) => {
    const options = getFetchOptions(request)
    const body = JSON.parse(options.body)
    const data = JSON.parse(NAIE.MISC.decodeBase64(body.data))
    const shelf_id = body.meta

    // Check if this is the first request for this meta
    if (!activePutShelfRequests.has(shelf_id)) {
        processNewShelf(shelf_id) // This will trigger a new PUT request
        activePutShelfRequests.set(shelf_id, 1)

        options.shouldBlock = true

        return options
    }

    data.description = stripTransientMetadataFromText(data.description)

    body.data = NAIE.MISC.encodeBase64(JSON.stringify(data))

    options.body = JSON.stringify(body)

    if (shelfState) {
        try {
            shelfState.upsertShelf(shelf_id, decodeShelf(body))
        } catch (e) {
            console.error('Error updating shelf state:', e)
        }
    }

    // Reset the state for this entity's requests after processing the second request
    if (activePutShelfRequests.has(shelf_id)) {
        activePutShelfRequests.delete(shelf_id)
    }

    createContextMenuTemplate()

    return options
}
