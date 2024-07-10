let preflightRun = false
const preflight = async () => {
    if (preflightRun) {
        return
    }
    preflightRun = true

    try {
        const app = await waitForElement(appSelector)

        const lock = lockLoader(app)
        console.log('locked loader')

        await waitForElement(settingsButtonSelector)

        preProcessIndicator()

        showIndicator('initializing subshelves...')

        await cloneSelectControl()

        await waitForElement(storyListSelector)

        await preProcessSidebar()
        await initGlobalObservers()

        createContextMenuTemplate()

        showIndicator('subshelves ready')

        lock.unlock()
    } catch (e) {
        console.error(e)
        throw new Error('preflight failed!')
    }
}

const lockLoader = (app) => {
    const loader = app.firstChild

    const clone = loader.cloneNode(true)
    clone.id = 'loader-lock'
    clone.style.zIndex = '1000'

    document.documentElement.append(clone)

    const unlock = () => {
        console.log('unlocking loader')
        document.documentElement.removeChild(clone)
    }
    return { unlock }
}
