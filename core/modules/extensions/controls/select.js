// Styles for the dropdown container
const DROPDOWN_CONTAINER_STYLES = {
    top: '100%',
    position: 'absolute',
    width: '100%',
    zIndex: '1',
    backgroundColor: 'rgb(26, 28, 46)',
    borderRadius: '0px',
    boxShadow: 'rgba(52, 56, 92, 0.6) 0px 0px 0px 1px, rgba(0, 0, 0, 0.2) 0px 4px 11px',
    boxSizing: 'border-box',
    margin: '0px',
}

// Styles for the options list container
const DROPDOWN_LIST_STYLES = {
    maxHeight: '200px',
    overflowY: 'auto',
    position: 'relative',
    boxSizing: 'border-box',
    padding: '0px',
}

// Common styles for dropdown options
const DROPDOWN_OPTION_STYLES = {
    cursor: 'pointer',
    display: 'block',
    fontSize: 'inherit',
    width: '100%',
    userSelect: 'none',
    webkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
    color: 'rgb(255, 255, 255)',
    padding: '8px 12px',
    boxSizing: 'border-box',
}

const DROPDOWN_NO_OPTIONS_STYLES = {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    padding: '8px 12px',
    boxSizing: 'border-box',
    display: 'none',
}

const controls_createSelectDropdown = (options, selectedValue) => {
    const dropdownContainer = NAIE.DOM.createElement('div', DROPDOWN_CONTAINER_STYLES)
    const optionsList = NAIE.DOM.createElement('div', DROPDOWN_LIST_STYLES)
    dropdownContainer.appendChild(optionsList)

    options.forEach(({ title, value }) => {
        const optionElement = NAIE.DOM.createElement('div', {
            ...DROPDOWN_OPTION_STYLES,
            backgroundColor: value === selectedValue ? 'rgb(16, 18, 36)' : 'transparent',
            fontStyle: title && title.toLowerCase().includes('no shelf') ? 'italic' : '',
        })

        optionElement.setAttribute('aria-disabled', 'false')
        optionElement.setAttribute('tabindex', '-1')
        optionElement.setAttribute('data-option-value', value)

        const optionText = NAIE.DOM.createElement('span')
        optionText.textContent = title
        // Also apply italic to the span for extra robustness
        if (title && title.toLowerCase().includes('no shelf')) {
            optionText.style.fontStyle = 'italic'
        }
        optionElement.appendChild(optionText)

        optionsList.appendChild(optionElement)
    })

    const noOptions = NAIE.DOM.createElement('div', DROPDOWN_NO_OPTIONS_STYLES)
    noOptions.classList.add('naie-select-no-options')
    noOptions.textContent = 'No options'
    optionsList.appendChild(noOptions)

    return dropdownContainer
}

const controls_constructSelectControl = (options, selectedValue, onChange) => {
    const template = controls_getTemplate()
    const controlElement = template.querySelector('.naie-select-control')
    const singleValueElement = template.querySelector('.naie-select-value')
    const inputElement = template.querySelector('.naie-select-input')
    const inputWrapper = template.querySelector('.naie-select-input-wrapper')

    const selectedOption = options.find((option) => option.value === selectedValue)
    if (selectedOption) {
        singleValueElement.textContent = selectedOption.title
        // Italicize if 'no shelf' is selected
        if (selectedOption.title && selectedOption.title.toLowerCase().includes('no shelf')) {
            singleValueElement.style.fontStyle = 'italic'
        } else {
            singleValueElement.style.fontStyle = ''
        }
    }

    const dropdown = controls_createSelectDropdown(options, selectedValue)
    dropdown.style.display = 'none'
    template.appendChild(dropdown)

    const updateDropdown = (filterText = '') => {
        let visibleOptionsCount = 0
        const optionElements = dropdown.querySelectorAll('[data-option-value]')
        const noOptions = dropdown.querySelector('.naie-select-no-options')
        optionElements.forEach((optionElement) => {
            const title = optionElement.textContent.toLowerCase()
            if (title.includes(filterText.toLowerCase())) {
                optionElement.style.display = 'block'
                visibleOptionsCount++
            } else {
                optionElement.style.display = 'none'
            }
        })

        if (visibleOptionsCount === 0) {
            noOptions.style.display = 'block'
        } else {
            noOptions.style.display = 'none'
        }
    }

    const toggleDropdown = () => {
        dropdown.style.display === 'none' ? showDropdown() : hideDropdown()
    }

    let outsideClickHandle = null

    const showDropdown = () => {
        dropdown.style.display = 'block'
        //singleValueElement.style.display = 'none'
        inputElement.focus()

        outsideClickHandle = dom_OnClickOutside(
            template,
            () => {
                hideDropdown()
            },
            true,
        )
    }

    const hideDropdown = () => {
        dropdown.style.display = 'none'
        singleValueElement.style.display = 'block'
        inputElement.value = ''
        updateDropdown()

        if (outsideClickHandle) {
            outsideClickHandle.remove()
            outsideClickHandle = null
        }
    }

    controlElement.addEventListener('click', toggleDropdown)

    inputElement.addEventListener('input', (e) => {
        inputElement.value = e.target.value
        inputElement.parentNode.dataset['value'] = e.target.value

        if (e.target.value.length > 0) {
            singleValueElement.style.display = 'none'
            inputWrapper.classList.add('naie-focus-override')
        } else {
            singleValueElement.style.display = 'block'
        }

        updateDropdown(e.target.value)
    })

    const optionElements = dropdown.querySelectorAll('[data-option-value]')
    optionElements.forEach((optionElement) => {
        optionElement.addEventListener('click', () => {
            const newValue = optionElement.getAttribute('data-option-value')
            const newTitle = optionElement.textContent
            singleValueElement.textContent = newTitle
            // Italicize if 'no shelf' is selected
            if (newTitle && newTitle.toLowerCase().includes('no shelf')) {
                singleValueElement.style.fontStyle = 'italic'
            } else {
                singleValueElement.style.fontStyle = ''
            }
            hideDropdown()

            optionElements.forEach((el) => {
                el.style.backgroundColor = el === optionElement ? 'rgb(16, 18, 36)' : 'transparent'
            })

            onChange(newValue)
        })
    })

    return template
}
