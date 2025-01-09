const saveIndicatorSelector = '.save-indicator'
const naieIndicatorSelector = '.naie-status-indicator'

const extensions_createNAIEindicatorElement = () => {
    const saveIndicator = document.querySelector(saveIndicatorSelector)

    const clone = saveIndicator.cloneNode()
    clone.style.zIndex = '2000'
    clone.classList.remove(saveIndicatorSelector)
    clone.classList.add(naieIndicatorSelector.substring(1)) // remove . from selector

    saveIndicator.parentNode.insertBefore(clone, saveIndicator.nextSibling)

    return extensions_getNAIEindicator()
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
    //const logContainer = document.getElementById(logContainerId)
    const messageManager = extensions_createMessageManager()

    const addMessageToLog = (message) => {
        const messageElement = document.createElement('div')
        messageElement.className = 'notification'
        messageElement.textContent = message
        logContainer.insertBefore(messageElement, logContainer.firstChild)

        setTimeout(() => {
            messageElement.classList.add('fade-out')
            setTimeout(() => {
                logContainer.removeChild(messageElement)
                if (messageManager.hasMessages()) {
                    addMessageToLog(messageManager.popMessage())
                }
            }, 500) // need to match css transition time
        }, duration)
    }

    const displayMessage = (message) => {
        if (logContainer.children.length < maxRows) {
            addMessageToLog(message)
        } else {
            messageManager.pushMessage(message)
        }
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
