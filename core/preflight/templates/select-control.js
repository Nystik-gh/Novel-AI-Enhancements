let selectControlTemplate = null

const cloneSelectControl = async () => {
    try {
        simulateClick(getSettingsButton())

        const settingsModal = await waitForSettingsModal(null, true)

        const { fontSelect } = await settingsModal.panels.getThemePanel()

        const template = createSelectControlTemplate(fontSelect)

        selectControlTemplate = template

        addGlobalStyle(`
        .naie-focus-override:focus-within {
            opacity: 1 !important;
        }
    `)

        simulateClick(settingsModal.closeButton)
    } catch (e) {
        console.error(e)
        throw new Error('Failed to clone select element')
    }
}

const createSelectControlTemplate = (fontSelect) => {
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

    return control
}

const getSelectControlTemplate = () => selectControlTemplate
