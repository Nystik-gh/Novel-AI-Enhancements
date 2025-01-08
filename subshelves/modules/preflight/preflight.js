let preflightRun = false
const preflight = async () => {
    if (preflightRun) {
        return
    }
    preflightRun = true

    try {
        const app = await waitForElement(appSelector)

        const lock = NAIE.EXTENSIONS.Loader.lockLoader(app)
        //console.log('locked loader')

        await waitForElement(settingsButtonSelector)

        showIndicator('initializing subshelves...')

        await cloneSelectControl()

        await waitForElement(menubarSelector)

        showIndicator('subshelves ready')

        await waitForElement(storyListSelector)

        if (!sidebarLock) {
            sidebarLock = lockSideBar(true, true, true)
            await sleep(100)
        }

        lock.unlock()

        await preProcessSidebar()
        await initGlobalObservers()

        if (AreThereShelves()) {
            createContextMenuTemplate()
        }

        if (sidebarLock) {
            sidebarLock.unlock()
        }
    } catch (e) {
        console.error(e)
        throw new Error('preflight failed!')
    }
}
