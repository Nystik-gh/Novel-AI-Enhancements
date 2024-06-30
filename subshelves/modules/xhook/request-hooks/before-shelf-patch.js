const preShelfPatch = (request) => {
    const options = getFetchOptions(request)

    const body = JSON.parse(options.body)
    const data = JSON.parse(decodeBase64(body.data))

    const metadata = parseMetadata(data.description)
    console.log('patch metadata', structuredClone(metadata))
    delete metadata.shelf_id

    data.description = writeMetadata(data.description, metadata)
    body.data = encodeBase64(JSON.stringify(data))

    options.body = JSON.stringify(body)

    return options
}
