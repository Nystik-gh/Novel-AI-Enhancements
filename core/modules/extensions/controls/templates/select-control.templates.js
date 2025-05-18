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

/**
 * Creates a custom dropdown select component from a list of option strings.
 * Styles are injected as CSS classes with the prefix "naie-control-".
 *
 * @param {string[]} optionsList - The array of option strings for the dropdown.
 * @param {string} [selected] - Optional, the currently selected option.
 * @returns {HTMLElement} The custom dropdown element.
 */
const controls_createCustomSelectTemplate = (optionsList = [], selected = '') => {
    // --- Inject styles ---
    if (!document.getElementById('naie-control-style')) {
        const style = document.createElement('style')
        style.id = 'naie-control-style'
        style.innerHTML = `
.naie-control-select {
    position: relative;
    box-sizing: border-box;
    flex: 1 1 auto;
    overflow: visible;
    box-shadow: 0 0 1px 0 rgba(255,255,255,0.6);
    background: none;
    font-family: inherit;
}
.naie-control-control {
    align-items: center;
    cursor: pointer;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    min-height: 24px;
    outline: none;
    position: relative;
    transition: all 100ms;
    background-color: transparent;
    border-radius: 0;
    border: none;
    box-shadow: none;
    box-sizing: border-box;
}
.naie-control-input-wrapper {
    align-items: center;
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    padding: 0 8px 0 10px;
    box-sizing: border-box;
    height: 24px;
}
.naie-control-value {
    color: rgb(255,255,255);
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
}
.naie-control-indicators {
    align-items: center;
    align-self: stretch;
    display: flex;
    flex-shrink: 0;
    box-sizing: border-box;
    padding: 0;
    height: 22px;
}
.naie-control-separator {
    align-self: stretch;
    width: 1px;
    background-color: #13152C;
    margin-bottom: 8px;
    margin-top: 8px;
    box-sizing: border-box;
}
.naie-control-dropdown-indicator {
    display: flex;
    transition: color 150ms;
    color: #FFFFFF;
    padding: 8px;
    box-sizing: border-box;
}
.naie-control-dropdown-indicator svg {
    fill: currentcolor;
    stroke: currentcolor;
    stroke-width: 0;
}
.naie-control-menu {
    top: 100%;
    position: absolute;
    left: 0;
    width: 100%;
    z-index: 999;
    background-color: rgb(33,35,53);
    border-radius: 0;
    box-shadow: rgba(72,75,105,0.6) 0 0 0 1px, rgba(0,0,0,0.2) 0 4px 11px;
    box-sizing: border-box;
    margin: 0;
    max-height: 200px;
    overflow-y: auto;
    display: none;
}
.naie-control-menu.open {
    display: block;
}
.naie-control-option {
    cursor: pointer;
    display: block;
    font-size: inherit;
    width: 100%;
    user-select: none;
    background-color: transparent;
    color: rgb(255,255,255);
    padding: 8px 12px;
    box-sizing: border-box;
    transition: background 0.17s;
}
.naie-control-option.selected {
    background-color: rgb(26,28,46,0.6);
    color: rgb(245,243,194);
}
.naie-control-option:hover {
    background-color: rgb(26,28,46);
}
        `
        document.head.appendChild(style)
    }

    // --- Build dropdown structure ---
    const container = document.createElement('div')
    container.className = 'naie-control-select'

    const control = document.createElement('div')
    control.className = 'naie-control-control'

    // Value/Input wrapper
    const valueContainer = document.createElement('div')
    valueContainer.className = 'naie-control-input-wrapper'

    const valueSpan = document.createElement('span')
    valueSpan.className = 'naie-control-value'
    valueSpan.textContent = selected || optionsList[0] || ''
    valueContainer.appendChild(valueSpan)

    // Indicators (separator + dropdown arrow)
    const indicatorsContainer = document.createElement('div')
    indicatorsContainer.className = 'naie-control-indicators'

    const separator = document.createElement('span')
    separator.className = 'naie-control-separator'
    indicatorsContainer.appendChild(separator)

    const dropdownIndicator = document.createElement('div')
    dropdownIndicator.className = 'naie-control-dropdown-indicator'
    dropdownIndicator.setAttribute('aria-hidden', 'true')
    dropdownIndicator.innerHTML = `
<svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path>
</svg>`
    indicatorsContainer.appendChild(dropdownIndicator)

    control.appendChild(valueContainer)
    control.appendChild(indicatorsContainer)

    // Menu (dropdown)
    const menu = document.createElement('div')
    menu.className = 'naie-control-menu'

    // Populate options
    optionsList.forEach((option) => {
        const optionDiv = document.createElement('div')
        optionDiv.className = 'naie-control-option' + (option === (selected || optionsList[0]) ? ' selected' : '')
        optionDiv.textContent = option
        optionDiv.tabIndex = 0
        optionDiv.addEventListener('mousedown', (e) => {
            e.preventDefault() // prevent blur
            valueSpan.textContent = option
            menu.querySelectorAll('.naie-control-option').forEach((opt) => opt.classList.remove('selected'))
            optionDiv.classList.add('selected')
            menu.classList.remove('open')
        })
        menu.appendChild(optionDiv)
    })

    // Show/hide menu on click
    control.addEventListener('mousedown', (e) => {
        e.preventDefault()
        if (menu.classList.contains('open')) {
            menu.classList.remove('open')
        } else {
            menu.classList.add('open')
        }
    })

    // Hide menu on blur (click outside)
    document.addEventListener('mousedown', (e) => {
        if (!container.contains(e.target)) {
            menu.classList.remove('open')
        }
    })

    // Keyboard navigation (up/down/enter)
    control.tabIndex = 0
    control.addEventListener('keydown', (e) => {
        if (!menu.classList.contains('open')) menu.classList.add('open')
        const opts = Array.from(menu.querySelectorAll('.naie-control-option'))
        let idx = opts.findIndex((opt) => opt.classList.contains('selected'))
        if (e.key === 'ArrowDown') {
            idx = Math.min(opts.length - 1, idx + 1)
            opts.forEach((opt) => opt.classList.remove('selected'))
            opts[idx].classList.add('selected')
            opts[idx].scrollIntoView({ block: 'nearest' })
            valueSpan.textContent = opts[idx].textContent
            e.preventDefault()
        } else if (e.key === 'ArrowUp') {
            idx = Math.max(0, idx - 1)
            opts.forEach((opt) => opt.classList.remove('selected'))
            opts[idx].classList.add('selected')
            opts[idx].scrollIntoView({ block: 'nearest' })
            valueSpan.textContent = opts[idx].textContent
            e.preventDefault()
        } else if (e.key === 'Enter') {
            menu.classList.remove('open')
            e.preventDefault()
        } else if (e.key === 'Escape') {
            menu.classList.remove('open')
            e.preventDefault()
        }
    })

    // Assemble
    container.appendChild(control)
    container.appendChild(menu)

    return container
}

const controls_getTemplate = () => {
    if (!selectControlTemplate) {
        throw new Error('Select control template not initialized')
    }
    return selectControlTemplate.cloneNode(true)
}
