const registerKeystoreHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'keystore-put',
        priority: 10,
        urlPattern: '/user/keystore',
        methods: ['PUT'],
        modifyRequest: async (request) => {
            console.log('intercept keystore put (update keystore)')

            const options = NAIE.NETWORK.getFetchOptions(request)
            const body = JSON.parse(options.body)

            console.log(body)

            return {
                type: 'request',
                value: request,
            }
        },
        modifyResponse: async (response, request) => {
            console.log('intercept keystore put (update keystore)')

            try {
                const copy = response.clone()
                let data = await copy.json()

                console.log(data)

                const modifiedData = data

                return new Response(JSON.stringify(modifiedData), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                })
            } catch (e) {
                return response
            }
        },
    })
}
