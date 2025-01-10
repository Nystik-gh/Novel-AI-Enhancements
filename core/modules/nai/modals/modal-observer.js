const modalSelector = 'div[role="dialog"][aria-modal="true"]'

const naie_initModalObserver = () => {
    const emitter = new MISC_UTILS.Emitter()
    const observerOptions = {
        childList: true,
    }

    const observerCallback = async (mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const addedNodes = Array.from(mutation.addedNodes)
                const projectionNode = addedNodes.find(
                    (node) => node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('data-projection-id'),
                )

                if (projectionNode) {
                    const modal = await naie_collectModal(projectionNode)

                    if (modal) {
                        emitter.emit('modal', modal)
                        break
                    }
                }
            }
        }
    }

    const modalObserver = new MutationObserver(observerCallback)
    modalObserver.observe(document.body, observerOptions)

    const waitForSpecificModal = (predicate, timeout = 5000) => {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                emitter.off('modal', handler)
                reject(new Error('Modal wait timeout'))
            }, timeout)

            const handler = (modalData) => {
                if (predicate(modalData)) {
                    clearTimeout(timeoutId)
                    emitter.off('modal', handler)
                    resolve(modalData)
                }
            }

            emitter.on('modal', handler)
        })
    }

    return { emitter, observer: modalObserver, waitForSpecificModal }
}

const naie_collectModal = async (candidate) => {
    const modal = candidate.querySelector(modalSelector)

    if (!modal) {return null}

    try {
        const closeButton = await naie_waitForModalCloseButton(modal, 1000)
        return { 
            overlay: candidate, 
            modal, 
            closeButton 
        }
    } catch (e) {
        LOGGING_UTILS.getLogger().debug('failed to find close button', e)
        return null
    }
}

const naie_waitForModalCloseButton = (modal, timeout) => {
    return new Promise((resolve, reject) => {
        const checkCloseButton = () => {
            const matches = DOM_UTILS.findElementWithMaskImage(modal.querySelectorAll('button > div'), ['cross', '.svg'])
            
            if (matches.length > 0) {
                resolve(matches[0])
            } else {
                requestAnimationFrame(checkCloseButton)
            }
        }

        if (timeout) {
            setTimeout(() => {
                reject(new Error('Timeout: Close button not found within specified time'))
            }, timeout)
        }

        checkCloseButton()
    })
}