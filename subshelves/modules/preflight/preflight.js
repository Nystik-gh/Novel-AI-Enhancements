let preflightRun = false
const preflight = async () => {
    if (preflightRun) {
        return
    }
    preflightRun = true

    try {
        const app = await waitForElement(appSelector)

        const lock = lockLoader(app)
        //console.log('locked loader')

        await waitForElement(settingsButtonSelector)

        preProcessIndicator()

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

let loaderTemplate = null

const lockLoader = (app) => {
    if (loaderTemplate === null) {
        loaderTemplate = app.firstChild.cloneNode(true)
    }

    const loader = loaderTemplate

    const clone = loader.cloneNode(true)
    clone.id = 'loader-lock'
    clone.style.zIndex = '1000'

    document.documentElement.append(clone)

    const unlock = () => {
        //console.log('unlocking loader')
        document.documentElement.removeChild(clone)
    }
    return { unlock }
}
