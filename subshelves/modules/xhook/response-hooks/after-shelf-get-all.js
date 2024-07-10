const postShelfGetAll = async (response) => {
    const copy = response.clone()
    let data = await copy.json()
    shelfState = createShelfState(buildShelfMap(data.objects))
    console.log('after response shelf map', shelfState)
    const modifiedData = { objects: InjectShelfTransientMeta(data.objects) }
    console.log('data', data)
    console.log('modifiedData', modifiedData)
    const modifiedText = JSON.stringify(modifiedData)
    const modifiedResponse = new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    })

    return modifiedResponse
}
