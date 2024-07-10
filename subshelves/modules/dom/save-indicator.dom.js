const saveIndicatorSelector = '.save-indicator'
const naieIndicatorSelector = '.naie-status-indicator'

const getNAIEindicator = () => {
    return document.querySelector(naieIndicatorSelector)
}

const createNAIEindicator = () => {
    const saveIndicator = document.querySelector(saveIndicatorSelector)

    const clone = saveIndicator.cloneNode()
    clone.style.zIndex = '2000'
    clone.classList.remove(saveIndicatorSelector)
    clone.classList.add(naieIndicatorSelector.substring(1))

    saveIndicator.parentNode.insertBefore(clone, saveIndicator.nextSibling)
}

const showIndicator = async (text) => {
    const indicator = getNAIEindicator()

    indicator.textContent = text

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            indicator.textContent = ''
            resolve()
        }, 3000)
    })
}
