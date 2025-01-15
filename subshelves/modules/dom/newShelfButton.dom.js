const findNewShelfButton = () => {
    return document.querySelector(newShelfButtonSelector)
}

const initNewSubShelfButton = () => {
    const newShelfButton = findNewShelfButton()

    if (activeShelf !== null) {
        newShelfButton.disabled = false

        newShelfButton.style.opacity = 1

        newShelfButton.dataset['newSubShelf'] = 'true'

        NAIE.DOM.addEventListenerOnce(newShelfButton, 'click', (e) => {
            if (newShelfButton.dataset['newSubShelf'] === 'true') {
                e.preventDefault()
                createNewShelf()
            }
        })
    } else {
        newShelfButton.dataset['newSubShelf'] = false
    }
}
