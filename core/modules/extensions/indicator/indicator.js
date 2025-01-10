const saveIndicatorSelector = '.save-indicator'
const naieIndicatorSelector = '.naie-status-indicator'

const extensions_createNAIEindicatorElement = () => {
    const saveIndicator = document.querySelector(saveIndicatorSelector)

    const container = document.createElement('div')
    container.classList.add(naieIndicatorSelector.substring(1))
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 5px;
        pointer-events: none;
    `

    // Copy relevant styles from save indicator
    const saveStyles = window.getComputedStyle(saveIndicator)
    container.style.font = saveStyles.font
    container.style.color = saveStyles.color

    document.body.appendChild(container)
    return container
}

const extensions_getNAIEindicator = () => {
    return document.querySelector(naieIndicatorSelector)
}

const extensions_createMessageManager = () => {
    let messageQueue = []

    const pushMessage = (message) => {
        messageQueue.push(message)
    }

    const popMessage = () => {
        return messageQueue.shift()
    }

    const hasMessages = () => {
        return messageQueue.length > 0
    }

    return {
        pushMessage,
        popMessage,
        hasMessages,
    }
}

const extensions_createIndicatorManager = (logContainer, maxRows, duration = 2000) => {
    const messageManager = extensions_createMessageManager()
    const staggerDelay = 500 // Delay between message insertions
    let isInserting = false

    const processMessageQueue = async () => {
        if (isInserting || !messageManager.hasMessages() || logContainer.children.length >= maxRows) {
            return
        }

        isInserting = true
        const message = messageManager.popMessage()
        
        const messageElement = document.createElement('div')
        messageElement.className = 'notification'
        messageElement.textContent = message
        
        // Wait for stagger delay before inserting
        await new Promise(r => setTimeout(r, staggerDelay))
        logContainer.appendChild(messageElement)
        isInserting = false

        setTimeout(() => {
            messageElement.classList.add('fade-out')
            setTimeout(() => {
                if (messageElement.parentNode === logContainer) {
                    logContainer.removeChild(messageElement)
                }
                processMessageQueue() // Try to show next message
            }, 500) // need to match css transition time
        }, duration)

        // If we still have room, process next message
        if (logContainer.children.length < maxRows) {
            processMessageQueue()
        }
    }

    const displayMessage = (message) => {
        messageManager.pushMessage(message)
        processMessageQueue()
    }

    return {
        displayMessage,
    }
}

const extensions_createNAIEIndicator = () => {
    const maxRows = 5
    const duration = 2000

    const container = extensions_createNAIEindicatorElement()
    const manager = extensions_createIndicatorManager(container, maxRows, duration)

    return manager
}
