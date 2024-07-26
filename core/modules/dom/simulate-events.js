const dom_simulateClick = (element) => {
    if (element) {
        element.click()
    }
}

const dom_simulateRightClick = (element) => {
    const evt = new Event('contextmenu', { bubbles: true, cancelable: false })
    element.dispatchEvent(evt)
}

const dom_simulateInputEvent = (element) => {
    element.dispatchEvent(new Event('input', { bubbles: true }))
}
