const waitForThemePanel = async (modal) => {
    const content = modal.querySelector('.settings-content')

    if (!content) {
        throw new Error('settings content not found')
    }

    const themeIndicator = await waitForElement('button[aria-label="Import Theme File"]', 15000)

    if (!themeIndicator) {
        throw new Error('cannot identify theme panel')
    }

    const fontSelect = content.querySelector('.font-select')

    return { fontSelect }
}
