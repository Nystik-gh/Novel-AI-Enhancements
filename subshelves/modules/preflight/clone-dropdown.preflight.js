let selectControlTemplate = null

const cloneSelectControl = async () => {
    simulateClick(getSettingsButton())

    const settingsModal = await waitForSettingsModal(500)
    console.log('settings modal', settingsModal)

    console.log('close button', settingsModal.closeButton)

    const { fontSelect } = await settingsModal.panels.getThemePanel()

    const template = createSelectControlTemplate(fontSelect)

    selectControlTemplate = template

    fontSelect.parentNode.insertBefore(
        constructSelectControl(
            [
                { title: 'Option 1', value: '1' },
                { title: 'Option 2', value: '2' },

                { title: 'Option 3', value: '3' },
                { title: 'Option 4', value: '4' },

                { title: 'Option 5', value: '5' },
            ],
            2,
        ),
        fontSelect,
    )
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
