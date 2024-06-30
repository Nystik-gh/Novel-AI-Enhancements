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
