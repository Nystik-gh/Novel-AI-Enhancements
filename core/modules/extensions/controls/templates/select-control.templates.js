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

function controls_createCustomSelectTemplate() {
    injectNaieControlStyles()
    // Create main container
    const container = document.createElement('div')
    container.className = 'naie-control-select'

    // Create control container
    const control = document.createElement('div')
    control.className = 'naie-control-control'

    // Create value container
    const valueContainer = document.createElement('div')
    valueContainer.className = 'naie-control-input-wrapper'

    // Create single value display
    const singleValue = document.createElement('div')
    const valueSpan = document.createElement('span')
    valueSpan.className = 'naie-control-value'
    valueSpan.textContent = ''
    singleValue.appendChild(valueSpan)

    // Create input container
    const inputContainer = document.createElement('div')
    const input = document.createElement('input')
    input.className = 'naie-control-input'
    Object.assign(input.style, {}) // All styles are now in CSS class
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
    indicatorsContainer.className = 'naie-control-indicators'

    // Create separator
    const separator = document.createElement('span')
    separator.className = 'naie-control-separator'

    // Create dropdown indicator
    const dropdownIndicator = document.createElement('div')
    dropdownIndicator.className = 'naie-control-dropdown-indicator'
    dropdownIndicator.setAttribute('aria-hidden', 'true')

    // Create dropdown arrow SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('height', '20')
    svg.setAttribute('width', '20')
    svg.setAttribute('viewBox', '0 0 20 20')
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('focusable', 'false')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute(
        'd',
        'M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z',
    )
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

    return container
}

const controls_getTemplate = () => {
    if (!selectControlTemplate) {
        throw new Error('Select control template not initialized')
    }
    return selectControlTemplate.cloneNode(true)
}

function injectNaieControlStyles() {
    if (document.getElementById('naie-control-style')) return
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
.naie-control-input {
  color: inherit;
  background: 0;
  opacity: 1;
  width: 100%;
  font: inherit;
  min-width: 2px;
  border: 0;
  margin: 0;
  outline: 0;
  padding: 0;
  box-sizing: border-box;
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
`
    document.head.appendChild(style)
}
