const waitForThemePanel = async (modal) => {
    logging_getLogger().debug('waitForThemePanel')
    const content = modal.querySelector('.settings-content')
    logging_getLogger().debug('content', content)

    if (!content) {
        throw new Error('settings content not found')
    }

    const themeIndicator = await dom_waitForElement('button[aria-label="Import Theme File"]', 15000)

    if (!themeIndicator) {
        throw new Error('cannot identify theme panel')
    }

    const fontSelect = content.querySelector('.font-select')

    return { fontSelect }
}
