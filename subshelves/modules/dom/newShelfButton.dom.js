const findNewShelfButton = () => {
    return document.querySelector(newShelfButtonSelector)
}

const initNewSubShelfButton = () => {
    const newShelfButton = findNewShelfButton()

    console.log('initNewSubShelfButton', 'activeShelf', activeShelf, newShelfButton.disabled)

    if (activeShelf !== null) {
        newShelfButton.disabled = false

        newShelfButton.style.opacity = 1

        newShelfButton.dataset['newSubShelf'] = 'true'

        addEventListenerOnce(newShelfButton, 'click', (e) => {
            if (newShelfButton.dataset['newSubShelf'] === 'true') {
                e.preventDefault()
                console.log('subshelf new shelf click')
                createNewShelf()
            }
        })
    } else {
        newShelfButton.dataset['newSubShelf'] = false
    }
}
