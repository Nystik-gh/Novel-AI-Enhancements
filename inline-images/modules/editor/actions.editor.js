const SAVE_CHARACTER_SEQUENCE = ';;|💾|;;'

let memoryLock = null

const getMemoryInput = () => {
    const expandButton = document.querySelector('button[aria-label="expand memory"]')
    if (!expandButton) return null
    return expandButton.parentElement.querySelector('textarea')
}

const getAuthorNoteInput = () => {
    const expandButton = document.querySelector(`button[aria-label="expand author's note"]`)
    if (!expandButton) return null
    return expandButton.parentElement.querySelector('textarea')
}

const lockMemoryInput = () => {
    if (memoryLock && memoryLock.isLocked) {
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

    memoryLock = {
        isLocked: true,
        unlock: () => {
            // Remove clone and restore original
            memoryLock.isLocked = false
            clone.remove()
            memory.style.removeProperty('display')

            // Clean up the save character sequence without triggering event
            if (memory.value.includes(SAVE_CHARACTER_SEQUENCE)) {
                const cleanValue = memory.value.replace(SAVE_CHARACTER_SEQUENCE, '')
                NAIE.DOM.setNativeValue(memory, cleanValue)
                // No simulateInputEvent call here to avoid triggering additional save
            }
        },
    }
}

const triggerSave = async () => {
    console.log('triggering save')
    const memory = getMemoryInput()
    const authornote = getAuthorNoteInput()
    if (!memory || !authornote) return

    // Look for save indicator before triggering save
    const saveIndicator = document.querySelector('.save-indicator')
    if (!saveIndicator) {
        console.error('Save indicator not found')
        alert('Failed to save image position: Save indicator not found.')
        return
    }

    // Store initial indicator text
    const initialIndicatorText = saveIndicator.textContent || ''

    try {
        lockMemoryInput()

        // Add save sequence and trigger input event
        NAIE.DOM.setNativeValue(memory, memory.value + SAVE_CHARACTER_SEQUENCE)
        NAIE.DOM.simulateInputEvent(memory)

        // Wait for save indicator to show "Saving..."
        const saved = await Promise.race([
            new Promise((resolve) => {
                const observer = new MutationObserver(() => {
                    if (saveIndicator.textContent.includes('Saving')) {
                        observer.disconnect()
                        resolve(true)
                    }
                })
                observer.observe(saveIndicator, { childList: true, subtree: true, characterData: true })
            }),
            NAIE.MISC.sleep(500).then(() => false), // Timeout after 500ms
        ])

        if (!saved) {
            // If save didn't trigger, try removing the sequence
            console.warn('Save not detected, removing sequence and trying again')
            NAIE.DOM.setNativeValue(memory, memory.value.replace(SAVE_CHARACTER_SEQUENCE, ''))
            NAIE.DOM.simulateInputEvent(memory)

            // Check if save triggered now
            const savedRetry = await Promise.race([
                new Promise((resolve) => {
                    const observer = new MutationObserver(() => {
                        if (saveIndicator.textContent.includes('Saving')) {
                            observer.disconnect()
                            resolve(true)
                        }
                    })
                    observer.observe(saveIndicator, { childList: true, subtree: true, characterData: true })
                }),
                NAIE.MISC.sleep(500).then(() => false),
            ])

            if (!savedRetry) {
                throw new Error('Failed to trigger save after multiple attempts')
            }
        }

        console.log('Save successfully triggered')
        // Success case - don't unlock here as another function handles it
    } catch (error) {
        console.error('Save failed:', error)
        alert('Failed to save image position. Please try again or save manually.')

        // Only unlock on failure
        if (memoryLock) {
            memoryLock.unlock()
        }
    }
}
