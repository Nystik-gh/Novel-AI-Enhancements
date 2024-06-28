const loadXhookScript = () => {
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/xhook@latest/dist/xhook.min.js'
    script.onload = initializeXhook
    document.documentElement.prepend(script)
}

const initializeXhook = () => {
    //xhook.after(responseModifier);
    const nativeFetch = xhook.fetch.bind(window)
    xhook.before(beforeHook(nativeFetch))
}

const beforeHook = (nativeFetch) => async (request, callback) => {
    const fetchOptions = preRequestHandlers(request)

    try {
        const raw_response = await nativeFetch(request.url, fetchOptions)

        const response = await postRequestHandler(request, raw_response)

        callback(response)
    } catch (error) {
        console.error('Error fetching:', error)
    }
}

const getFetchOptions = (request) => {
    return {
        method: request.method,
        headers: request.headers,
        body: request.body,
        timeout: request.timeout,
        credentials: request.withCredentials ? 'include' : 'same-origin',
    }
}

const postRequestHandler = async (request, response) => {
    const baseShelfUrl = 'https://api.novelai.net/user/objects/shelf'
    const method = request.method?.toLowerCase()

    if (request.url.startsWith(baseShelfUrl)) {
        switch (method) {
            case 'get':
                return await postShelfGetAll(response)
            case 'patch':
                // Add your patch logic here
                break
            case 'put':
                return await postShelfPut(response)
            case 'delete':
                // Add your delete logic here
                break
            default:
                return response
        }
    } else {
        return response
    }
}

const preRequestHandlers = (request) => {
    const baseShelfUrl = 'https://api.novelai.net/user/objects/shelf'
    const method = request.method?.toLowerCase()

    if (request.url.startsWith(baseShelfUrl)) {
        switch (method) {
            case 'patch':
                return preShelfPatch(request)
            case 'delete':
                return getFetchOptions(request)
            default:
                return getFetchOptions(request)
        }
    } else {
        return getFetchOptions(request)
    }
}

const postShelfGetAll = async (response) => {
    const copy = response.clone()
    let data = await copy.json()
    shelfState = createShelfState(buildShelfMap(data.objects))
    console.log('after response shelf map', shelfState)
    const modifiedData = { objects: injectShelfMeta(data.objects) }
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

const postShelfPut = async (response) => {
    const copy = response.clone()
    let shelf = await copy.json()

    console.log(shelf)
    console.log('state', shelfState.getMap())
    const modifiedData = InjectShelfMetaSingle(shelf)

    const modifiedText = JSON.stringify(modifiedData)
    const modifiedResponse = new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    })

    return modifiedResponse
}

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
