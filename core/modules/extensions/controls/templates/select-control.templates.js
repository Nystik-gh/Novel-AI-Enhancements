let selectControlTemplate = null

const controls_initSelectTemplate = async () => {
    LOGGING_UTILS.getLogger().debug('controls_initSelectTemplate')
    try {
        // waiting for this lets us know that the page is loaded
        await DOM_UTILS.waitForElement(settingsButtonSelector)
        // Use the custom template instead of cloning from settings
        selectControlTemplate = controls_createCustomSelectTemplate()

        // Add global style for focus override
        MISC_UTILS.addGlobalStyle(`
            .naie-focus-override:focus-within {
                opacity: 1 !important;
            }
        `)
    } catch (e) {
        LOGGING_UTILS.getLogger().error('Failed to create custom select element:', e)
        throw new Error('Failed to create custom select element')
    }
}

// New custom template creation
const controls_createCustomSelectTemplate = () => {
    // Create main container
    const container = document.createElement('div')
    container.className = 'custom-select select naie-select-box'
    Object.assign(container.style, {
        position: 'relative',
        boxSizing: 'border-box',
        flex: '1 1 auto',
        overflow: 'visible',
        boxShadow: '0 0 1px 0 rgba(255, 255, 255, 0.6)',
    })

    // Create control container
    const control = document.createElement('div')
    control.className = 'naie-select-control'
    Object.assign(control.style, {
        alignItems: 'center',
        cursor: 'pointer',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        minHeight: '24px',
        outline: 'none',
        position: 'relative',
        transition: 'all 100ms',
        backgroundColor: 'transparent',
        borderColor: '#13152C',
        borderRadius: '0',
        borderStyle: 'solid',
        borderWidth: '0',
        boxShadow: 'none',
        boxSizing: 'border-box',
        border: 'none',
        height: '2.2rem',
    })

    // Create value container
    const valueContainer = document.createElement('div')
    valueContainer.className = 'naie-select-input-wrapper'
    Object.assign(valueContainer.style, {
        alignItems: 'center',
        display: 'flex',
        flex: '1',
        flexWrap: 'wrap',
        padding: '0px 8px 0 10px',
        boxSizing: 'border-box',
        height: '24px',
    })

    // Create single value display
    const singleValue = document.createElement('div')
    const valueSpan = document.createElement('span')
    valueSpan.className = 'naie-select-value'
    valueSpan.textContent = ''
    Object.assign(valueSpan.style, {
        color: 'rgb(255, 255, 255)',
        width: '100%',
        transition: 'opacity 0.2s',
    })
    singleValue.appendChild(valueSpan)
    Object.assign(singleValue.style, {
        position: 'absolute',
        left: '0.7rem',
        right: '0.7rem',
    })

    // Create input container
    const inputContainer = document.createElement('div')
    const input = document.createElement('input')
    input.className = 'naie-select-input'
    Object.assign(input.style, {
        color: 'inherit',
        background: '0',
        opacity: '1',
        width: '100%',
        grid: '1 / 2',
        font: 'inherit',
        minWidth: '2px',
        border: '0',
        margin: '0',
        outline: '0',
        padding: '0',
    })
    input.setAttribute('autocapitalize', 'none')
    input.setAttribute('autocomplete', 'off')
    input.setAttribute('autocorrect', 'off')
    input.setAttribute('spellcheck', 'false')
    input.setAttribute('tabindex', '0')
    input.setAttribute('type', 'text')
    input.setAttribute('aria-autocomplete', 'list')
    input.setAttribute('aria-expanded', 'false')
    input.setAttribute('aria-haspopup', 'true')
    input.setAttribute('role', 'combobox')
    inputContainer.appendChild(input)

    // Create indicators container
    const indicatorsContainer = document.createElement('div')
    Object.assign(indicatorsContainer.style, {
        alignItems: 'center',
        //alignSelf: 'stretch',
        display: 'flex',
        flexShrink: '0',
        boxSizing: 'border-box',
        padding: '0',
        height: '22px',
    })

    // Create separator
    const separator = document.createElement('span')
    Object.assign(separator.style, {
        alignSelf: 'stretch',
        width: '1px',
        backgroundColor: '#13152C',
        marginBottom: '8px',
        marginTop: '8px',
        boxSizing: 'border-box',
    })

    // Create dropdown indicator
    const dropdownIndicator = document.createElement('div')
    dropdownIndicator.setAttribute('aria-hidden', 'true')
    Object.assign(dropdownIndicator.style, {
        display: 'flex',
        transition: 'color 150ms',
        color: '#FFFFFF',
        padding: '8px',
        boxSizing: 'border-box',
    })

    // Create dropdown arrow SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('height', '20')
    svg.setAttribute('width', '20')
    svg.setAttribute('viewBox', '0 0 20 20')
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('focusable', 'false')
    // Ensure SVG itself has no fill, so path color is used
    svg.setAttribute('fill', 'none')

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute(
        'd',
        'M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z',
    )
    path.setAttribute('fill', '#fff') // Set path fill to white
    svg.appendChild(path)
    dropdownIndicator.appendChild(svg)

    // Assemble the component
    indicatorsContainer.appendChild(separator)
    indicatorsContainer.appendChild(dropdownIndicator)
    valueContainer.appendChild(singleValue)
    valueContainer.appendChild(inputContainer)
    control.appendChild(valueContainer)
    control.appendChild(indicatorsContainer)
    container.appendChild(control)

    // Add a helper to set italic if 'no shelf' is selected
    function updateSingleValueStyle(selectedText) {
        if (selectedText && selectedText.toLowerCase().includes('no shelf')) {
            valueSpan.style.fontStyle = 'italic'
        } else {
            valueSpan.style.fontStyle = ''
        }
    }
    // Call this whenever valueSpan.textContent is set
    // When setting valueSpan.textContent, also update style
    valueSpan.textContent = ''
    updateSingleValueStyle(valueSpan.textContent)

    // When option is selected in dropdown, also update style
    // (Assume you have a dropdown logic elsewhere, but add a sample handler)
    // Example:
    // optionElement.addEventListener('click', () => {
    //     valueSpan.textContent = optionText
    //     updateSingleValueStyle(optionText)
    // })

    // In dropdown, make 'no shelf' option italic
    // (Assume you have a dropdown creation loop elsewhere, but add a sample)
    // Example:
    // if (option.title && option.title.toLowerCase().includes('no shelf')) {
    //     optionElement.style.fontStyle = 'italic'
    // }

    return container
}

const controls_getTemplate = () => {
    if (!selectControlTemplate) {
        throw new Error('Select control template not initialized')
    }
    return selectControlTemplate.cloneNode(true)
}
