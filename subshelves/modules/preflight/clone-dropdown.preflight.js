const cloneSelectControl = async () => {
    simulateClick(getSettingsButton())

    const settingsModal = await waitForSettingsModal(500)
    console.log('settings modal', settingsModal)

    console.log('close button', settingsModal.closeButton)

    const { fontSelect } = await settingsModal.panels.getThemePanel()

    const template = createSelectControlTemplate(fontSelect)

    fontSelect.parentNode.insertBefore(template, fontSelect)

    console.log(template)
}

const createSelectControlTemplate = (fontSelect) => {
    const clone = fontSelect.cloneNode(true)
    const control = clone.children[2]

    if (!Array.from(control.classList).some((cls) => cls.endsWith('-control'))) {
        throw new Error('unable to identify select control')
    }

    const selectedValueText = control.firstChild.querySelector('span')
    const inputElement = control.firstChild.querySelector('input')

    inputElement.id = ''

    clone.classList.add('naie-select-box')
    control.classList.add('naie-select-control')
    selectedValueText.classList.add('naie-select-value')
    inputElement.classList.add('naie-select-input')

    selectedValueText.textContent = ''

    return clone
}
