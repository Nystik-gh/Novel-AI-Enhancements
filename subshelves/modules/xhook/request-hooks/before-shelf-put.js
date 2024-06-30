const activePutShelfRequests = new Map()

const preShelfPut = (request) => {
    const options = getFetchOptions(request)

    const body = JSON.parse(options.body)
    const data = JSON.parse(decodeBase64(body.data))

    if (!activePutShelfRequests.has(body.meta)) {
        newShelfProcessHandler(body.meta)
        activePutShelfRequests.set(body.meta, 1)
    } else {
        activePutShelfRequests.set(body.meta, activePutShelfRequests.get(body.meta) + 1)
    }

    //TODO: inject parent id here, or do that via patch?

    const metadata = parseMetadata(data.description)
    console.log('put', body, data, structuredClone(metadata))
    delete metadata.shelf_id

    data.description = writeMetadata(data.description, metadata)
    body.data = encodeBase64(JSON.stringify(data))

    options.body = JSON.stringify(body)

    return options
}
