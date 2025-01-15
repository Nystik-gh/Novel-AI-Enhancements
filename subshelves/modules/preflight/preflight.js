let preflightRun = false
const preflight = async () => {
    if (preflightRun) {
        return
    }
    preflightRun = true

    try {
        const registerSubshelvesHooks = () => {
            // Early stage - Basic UI elements and controls
            /*NAIE.PREFLIGHT.registerHook(
                'early',
                'subshelves-network',
                10,
                async () => {
                    initializeNetworkHooks()
                }
            )*/

            // Main stage - Core functionality
            NAIE.PREFLIGHT.registerHook('main', 'subshelves-core', 10, async () => {
                //await NAIE.DOM.waitForElement(menubarSelector)
                await NAIE.DOM.waitForElement(storyListSelector)
                if (!sidebarLock) {
                    sidebarLock = lockSideBar(true, true, true)
                    await NAIE.MISC.sleep(100)
                }
                await preProcessSidebar()
                await initGlobalObservers() // implement core
            })

            // Late stage - Final setup
            NAIE.PREFLIGHT.registerHook('late', 'subshelves-final', 10, async () => {
                if (AreThereShelves()) {
                    createContextMenuTemplate()
                }
                if (sidebarLock) {
                    sidebarLock.unlock()
                }
                NAIE.SERVICES.statusIndicator.displayMessage('Subshelves initialized')
            })
        }

        registerSubshelvesHooks()
    } catch (e) {
        console.error('Failed to register subshelves preflight hooks:', e)
        throw new Error('Subshelves preflight initialization failed!')
    }
}
