const postShelfPut = async (response) => {
    const copy = response.clone()
    let shelf = await copy.json()

    if (activePutShelfRequests.has(shelf.meta)) {
        const newValue = activePutShelfRequests.get(shelf.meta) - 1
        if (newValue <= 0) {
            activePutShelfRequests.delete(shelf.meta)
        } else {
            activePutShelfRequests.set(shelf.meta, newValue)
        }
    }

    if (shelfState) {
        try {
            shelfState.upsertShelf(shelf.meta, decodeShelf(shelf))
        } catch (e) {}
    }
    console.log('map', shelf.meta, shelfState.getMap())

    const modifiedData = InjectShelfMetaSingle(shelf)

    const modifiedText = JSON.stringify(modifiedData)
    const modifiedResponse = new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    })

    return modifiedResponse
}
