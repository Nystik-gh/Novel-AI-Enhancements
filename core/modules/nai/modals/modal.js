const modalSelector = 'div[role="dialog"][aria-modal="true"]'

const nai_waitForModal = async (timeout) => {
    const modal = await waitForElement(modalSelector, timeout)

    const overlay = modal?.parentNode?.parentNode?.hasAttribute('data-projection-id') ? modal?.parentNode?.parentNode : null

    if (!overlay) {
        throw new Error('element does not match expected Modal structure. No overlay found.')
    }

    const closeButton = await nai_waitForCloseButton(modal)

    return { modal, overlay, closeButton }
}

const nai_waitForCloseButton = (modal) => {
    return new Promise((resolve) => {
        const checkCloseButton = () => {
            const closeButton = findElementWithMaskImage(modal.querySelectorAll('button, button > div'), ['cross', '.svg'])?.[0]
            if (closeButton !== null) {
                resolve(closeButton)
            } else {
                requestAnimationFrame(checkCloseButton)
            }
        }
        checkCloseButton()
    })
}
