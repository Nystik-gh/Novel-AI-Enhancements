const preShelfPatch = (request) => {
    const options = getFetchOptions(request)

    const body = JSON.parse(options.body)
    const data = JSON.parse(NAIE.MISC.decodeBase64(body.data))
    const shelf_id = body.meta

    data.description = stripTransientMetadataFromText(data.description)

    body.data = NAIE.MISC.encodeBase64(JSON.stringify(data))

    options.body = JSON.stringify(body)

    if (shelfState) {
        try {
            shelfState.upsertShelf(shelf_id, decodeShelf(body))
            processStoryList()
        } catch (e) {
            console.error('Error updating shelf state:', e)
        }
    }

    return options
}
