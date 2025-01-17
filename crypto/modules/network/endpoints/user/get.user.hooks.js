const registerUserDataHooks = () => {
    NAIE.NETWORK.manager.registerHook({
        id: 'user-data-get',
        priority: 10,
        urlPattern: '/user/data',
        methods: ['GET'],
        modifyResponse: async (response, request) => {
            console.log('intercept data get (here we grab initial keystore)')
            const copy = response.clone()

            /** @type {UserData} */
            let data = await copy.json()

            console.log(data)

            const modifiedData = data

            return new Response(JSON.stringify(modifiedData), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
            })
        },
    })
}
