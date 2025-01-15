const isShelfDeleteModal = ({ modal }) => {
    const buttons = modal.firstChild?.lastChild?.querySelectorAll('button')
    return buttons?.length === 1 && modal.querySelector('button[aria-label="Close Modal"]')
}

const waitForShelfDeleteModal = async (timeout) => {
    const { waitForSpecificModal } = NAIE.SERVICES.modalObserver
    const modalData = await waitForSpecificModal(isShelfDeleteModal, timeout)

    return {
        ...modalData,
        deleteButton: modalData.modal.firstChild.lastChild.querySelector('button'),
    }
}