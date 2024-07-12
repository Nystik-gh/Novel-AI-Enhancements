const postShelfPatch = async (response) => {
    const copy = response.clone()
    let shelf = await copy.json()

    if (shelfState) {
        try {
            shelfState.upsertShelf(shelf.meta, decodeShelf(shelf))
        } catch (e) {}
    }

    const modifiedData = InjectShelfTransientMetaSingle(shelf)

    const modifiedText = JSON.stringify(modifiedData)
    const modifiedResponse = new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    })

    forceStoryListRefresh()

    return modifiedResponse
}
