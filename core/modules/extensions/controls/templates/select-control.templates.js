let selectControlTemplate = null

const controls_initSelectTemplate = async () => {
    LOGGING_UTILS.getLogger().debug('controls_initSelectTemplate')
    try {
        await DOM_UTILS.waitForElement(settingsButtonSelector)

        DOM_UTILS.simulateClick(getSettingsButton())

        const settingsModal = await waitForSettingsModal()
        const { fontSelect } = await settingsModal.panels.getThemePanel()
        selectControlTemplate = controls_createSelectControlTemplate(fontSelect)

        // Add global style for focus override
        MISC_UTILS.addGlobalStyle(`
            .naie-focus-override:focus-within {
                opacity: 1 !important;
            }
        `)

        DOM_UTILS.simulateClick(settingsModal.closeButton)
    } catch (e) {
        LOGGING_UTILS.getLogger().error('Failed to clone select element:', e)
        throw new Error('Failed to clone select element')
    }
}

const controls_createSelectControlTemplate = (fontSelect) => {
    const clone = fontSelect.cloneNode(true)
    const control = clone.children[2]

    if (!Array.from(control.classList).some((cls) => cls.endsWith('-control'))) {
        throw new Error('unable to identify select control')
    }

    // remove aria live region spans since we're not implementing them currently
    const span1 = clone.children[0]
    const span2 = clone.children[1]

    clone.removeChild(span1)
    clone.removeChild(span2)

    // tag wrapper for focus override fix
    const inputWrapper = control.firstChild
    inputWrapper.classList.add('naie-select-input-wrapper')

    const selectedValueText = control.firstChild.querySelector('span')
    const inputElement = control.firstChild.querySelector('input')

    inputElement.id = ''
    return clone
}

// Internal function, not exposed through API
const controls_getTemplate = () => {
    if (!selectControlTemplate) {
        throw new Error('Select control template not initialized')
    }
    return selectControlTemplate.cloneNode(true) // Always return a clone
}
