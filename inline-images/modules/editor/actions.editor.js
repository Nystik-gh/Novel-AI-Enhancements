const SAVE_CHARACTER_SEQUENCE = ';;|💾|;;'

let memoryLock = null

const getMemoryInput = () => {
    const expandButton = document.querySelector('button[aria-label="expand memory"]')
    if (!expandButton) return null
    return expandButton.parentElement.querySelector('textarea')
}

const lockMemoryInput = () => {
    if (memoryLock) {
        console.warn('Memory input already locked')
        return memoryLock
    }

    const memory = getMemoryInput()
    if (!memory) {
        console.error('Memory input not found')
        return null
    }

    const clone = memory.cloneNode(true)
    clone.id = 'memory-input-lock'
    clone.disabled = true

    // Hide original
    memory.style.display = 'none'

    // Insert clone
    memory.parentNode.insertBefore(clone, memory.nextSibling)

    return {
        unlock: () => {
            // Remove clone and restore original
            clone.remove()
            memory.style.removeProperty('display')
        },
    }
}

const triggerSave = () => {
    console.log('triggering save')
    const memory = getMemoryInput()
    if (!memory) return

    memoryLock = lockMemoryInput()
    NAIE.DOM.setNativeValue(memory, memory.value + SAVE_CHARACTER_SEQUENCE)
    NAIE.DOM.simulateInputEvent(memory)
}
