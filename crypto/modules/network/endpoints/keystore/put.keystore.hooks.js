const registerKeystoreHooks = () => {
    console.log('registerKeystoreHooks')
    NAIE.NETWORK.manager.registerHook({
        id: 'keystore-put',
        priority: 10,
        urlPattern: '/user/keystore',
        methods: ['PUT'],
        modifyRequest: async (request) => {
            console.log('intercept keystore put (update keystore)')

            const options = NAIE.NETWORK.getFetchOptions(request)

            /** @type {UserKeystore} */
            const keystore = JSON.parse(options.body)

            keystoreState.setKeystore(keystore)

            return {
                type: 'request',
                value: request,
            }
        },
        modifyResponse: async (response, request) => {
            console.log('intercept keystore put (update keystore)')

            try {
                const copy = response.clone()

                /** @type {UserKeystore} */
                let keystore = await copy.json()

                keystoreState.setKeystore(keystore)

                return response
            } catch (e) {
                return response
            }
        },
    })
}
