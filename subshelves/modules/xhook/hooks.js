const loadXhookScript = () => {
    //const script = document.createElement('script')
    //script.src = 'https://unpkg.com/xhook@latest/dist/xhook.min.js'
    //script.onload = initializeXhook
    //document.documentElement.prepend(script)
    initializeXhook()
}

const initializeXhook = () => {
    //xhook.after(responseModifier);
    const nativeFetch = xhook.fetch.bind(window)
    xhook.before(beforeHook(nativeFetch))
}

const beforeHook = (nativeFetch) => async (request, callback) => {
    const fetchOptions = preRequestHandlers(request)

    try {
        if (fetchOptions.shouldBlock) {
            callback(new Response('{}', { status: 418, statusText: 'Blocked by client' }))
            return
        }

        const raw_response = await nativeFetch(request.url, fetchOptions)

        const response = await postRequestHandler(request, raw_response)
        callback(response)
    } catch (error) {
        console.error('Error fetching:', error)
    }
}
