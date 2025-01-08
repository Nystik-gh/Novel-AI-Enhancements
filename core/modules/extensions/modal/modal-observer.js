const modalSelector = 'div[role="dialog"][aria-modal="true"]'

const naie_initModalObserver = () => {
    const emitter = new misc_Emitter()
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

    return { emitter, observer: modalObserver }
}

const naie_collectModal = async (candidate) => {
    const modal = candidate.querySelector(modalSelector)

    if (modal) {
        try {
            const closeButton = await naie_waitForModalCloseButton(modal, 1000)

            return { overlay: candidate, modal, closeButton }
        } catch (e) {}
    }

    return null
}

const naie_waitForModalCloseButton = (modal, timeout) => {
    return new Promise((resolve) => {
        const checkCloseButton = () => {
            const closeButton = findElementWithMaskImage(modal.querySelectorAll('button, button > div'), ['cross', '.svg'])?.[0]
            if (closeButton !== null) {
                resolve(closeButton)
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
