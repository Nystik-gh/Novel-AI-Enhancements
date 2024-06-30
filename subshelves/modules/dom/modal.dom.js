const waitForModal = async () => {
    const modal = await waitForElement(modalSelector)

    const overlay = modal?.parentNode?.parentNode?.hasAttribute('data-projection-id') ? modal?.parentNode?.parentNode : null

    const closeButton = findElementWithMaskImage(modal.querySelectorAll('button > div'), ['cross', '.svg'])?.[0]

    return { modal, overlay, closeButton }
}

const waitForShelfSettingsModal = async () => {
    let { modal, overlay, closeButton } = await waitForModal()

    const title = modal.querySelector('input')
    const description = modal.querySelector('textarea')

    return { modal, overlay, closeButton, fields: { title, description } }
}
