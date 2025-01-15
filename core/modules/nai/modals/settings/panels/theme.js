const waitForThemePanel = async (modal) => {
    LOGGING_UTILS.getLogger().debug('waitForThemePanel')
    const content = modal.querySelector('.settings-content')
    LOGGING_UTILS.getLogger().debug('content', content)

    if (!content) {
        throw new Error('settings content not found')
    }

    const themeIndicator = await DOM_UTILS.waitForElement('button[aria-label="Import Theme File"]', 15000)

    if (!themeIndicator) {
        throw new Error('cannot identify theme panel')
    }

    const fontSelect = content.querySelector('.font-select')

    return { fontSelect }
}
