const registerUserDataHooks = () => {
    console.log('registerUserDataHooks')
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

            const keystore = data.keystore

            keystoreState.setKeystore(keystore)

            const modifiedData = data

            return response
        },
    })
}
