const initModalObserver = () => {
    if (modalObserver) {
        console.log('modal observer already initiated, aborting...')
        return
    }

    modalObserver = true

    console.log('init modal observer')

    const observerOptions = {
        childList: true,
    }

    const observerCallback = (mutationsList, observer) => {
        // Trigger mapShelfMetadata when mutations indicate changes
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const addedNodes = Array.from(mutation.addedNodes)
                const hasProjectionId = addedNodes.some(
                    (node) => node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('data-projection-id'),
                )

                if (hasProjectionId) {
                    modalObserver.disconnect()

                    waitForShelfSettingsModal(100)
                        .then((data) => {
                            if (!data.modal?.dataset['proxied']) {
                                constructShelfSettingModal(data)
                            }
                            observer.observe(document.body, observerOptions)
                        })
                        .catch((error) => {
                            // Not a settingsModal
                            // having an empty catch block doesn't feel great, should probably rework modal handling at some point.
                            observer.observe(document.body, observerOptions)
                        })
                    break
                }
            }
        }
    }

    modalObserver = new MutationObserver(observerCallback)
    modalObserver.observe(document.body, observerOptions)
}

const waitForModal = async (timeout) => {
    const modal = await waitForElement(modalSelector, timeout)

    const overlay = modal?.parentNode?.parentNode?.hasAttribute('data-projection-id') ? modal?.parentNode?.parentNode : null

    const closeButton = modal ? findElementWithMaskImage(modal.querySelectorAll('button > div'), ['cross', '.svg'])?.[0] : null

    return { modal, overlay, closeButton }
}
