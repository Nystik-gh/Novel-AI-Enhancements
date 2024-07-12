const preShelfPatch = (request) => {
    const options = getFetchOptions(request)

    const body = JSON.parse(options.body)
    const data = JSON.parse(decodeBase64(body.data))
    const shelf_id = body.meta

    console.log('raw description', data.description)
    data.description = stripTransientMetadataFromText(data.description)
    console.log('cleaned description', data.description)

    body.data = encodeBase64(JSON.stringify(data))

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
