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

const createSelectDropdown = (options, selectedValue) => {
    const dropdownContainer = createElement('div', DROPDOWN_CONTAINER_STYLES)
    const optionsList = createElement('div', DROPDOWN_LIST_STYLES)
    dropdownContainer.appendChild(optionsList)

    options.forEach(({ title, value }) => {
        const optionElement = createElement('div', {
            ...DROPDOWN_OPTION_STYLES,
            backgroundColor: value === selectedValue ? 'rgb(16, 18, 36)' : 'transparent',
        })

        optionElement.setAttribute('aria-disabled', 'false')
        optionElement.setAttribute('tabindex', '-1')
        optionElement.setAttribute('data-option-value', value)

        const optionText = createElement('span')
        optionText.textContent = title
        optionElement.appendChild(optionText)

        optionsList.appendChild(optionElement)
    })

    return dropdownContainer
}

const constructSelectControl = (options, selectedValue) => {
    const selectControl = selectControlTemplate.cloneNode(true)
    selectControl.id = ''

    const controlElement = selectControl.querySelector('.css-1kctwbj-control')
    const singleValueElement = selectControl.querySelector('.css-4t5j3y-singleValue span')
    const inputElement = selectControl.querySelector('input')

    const selectedOption = options.find((option) => option.value === selectedValue)
    if (selectedOption) {
        singleValueElement.textContent = selectedOption.title
        singleValueElement.style.fontFamily = selectedOption.title
    }

    const dropdown = createSelectDropdown(options, selectedValue)
    dropdown.style.display = 'none'
    selectControl.appendChild(dropdown)

    const updateDropdown = (filterText = '') => {
        const optionElements = dropdown.querySelectorAll('[data-option-value]')
        optionElements.forEach((optionElement) => {
            const title = optionElement.textContent.toLowerCase()
            if (title.includes(filterText.toLowerCase())) {
                optionElement.style.display = 'block'
            } else {
                optionElement.style.display = 'none'
            }
        })
    }

    const showDropdown = () => {
        dropdown.style.display = 'block'
        inputElement.style.width = '100%'
        singleValueElement.style.display = 'none'
        inputElement.focus()
    }

    const hideDropdown = () => {
        dropdown.style.display = 'none'
        inputElement.style.width = '2px'
        singleValueElement.style.display = 'block'
        inputElement.value = ''
        updateDropdown()
    }

    controlElement.addEventListener('click', showDropdown)

    inputElement.addEventListener('input', (e) => {
        updateDropdown(e.target.value)
    })

    inputElement.addEventListener('blur', () => {
        // Delay hiding to allow for option selection
        setTimeout(hideDropdown, 200)
    })

    const optionElements = dropdown.querySelectorAll('[data-option-value]')
    optionElements.forEach((optionElement) => {
        optionElement.addEventListener('click', () => {
            const newValue = optionElement.getAttribute('data-option-value')
            const newTitle = optionElement.textContent
            singleValueElement.textContent = newTitle
            singleValueElement.style.fontFamily = newTitle
            hideDropdown()

            optionElements.forEach((el) => {
                el.style.backgroundColor = el === optionElement ? 'rgb(16, 18, 36)' : 'transparent'
            })

            // Trigger a change event or callback if needed
        })
    })

    return selectControl
}
