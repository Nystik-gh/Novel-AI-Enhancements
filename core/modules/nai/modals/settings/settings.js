const getSettingsButton = () => {
    return document.querySelector(settingsButtonSelector)
}

const waitForSettingsModal = async (timeout = 5000, hidden = false) => {
    const modalData = await NAIE_SERVICES.modalObserver.waitForSpecificModal(
        (modal) => modal.modal.querySelector('.settings-sidebar'),
        timeout
    )

    if (hidden && modalData.overlay) {
        modalData.overlay.style.display = 'none'
    }

    const sidebar = modalData.modal.querySelector('.settings-sidebar')

    const { tabs, changelog, logout, closeButton } = MISC_UTILS.isMobileView()
        ? await handleSettingsMobile(modalData.modal, sidebar)
        : await handleSettingsDesktop(modalData.modal, sidebar)

    return {
        modal: modalData.modal,
        overlay: modalData.overlay,
        closeButton: modalData.closeButton,
        tabs,
        extra: { changelog, logout },
        panels: {
            getThemePanel: () => getPanel(modalData.modal, tabs.theme, waitForThemePanel),
        },
    }
}

const handleSettingsDesktop = async (modal, sidebar) => {
    do {
        await MISC_UTILS.sleep(50)
    } while (sidebar?.parentNode?.parentNode?.previousSibling?.tagName?.toLowerCase() !== 'button')

    const buttons = sidebar.querySelectorAll('button')

    if (buttons.length < 9) {
        throw new Error('Not all required buttons are found')
    }

    const tabs = {
        ai_settings: buttons[0],
        interface: buttons[1],
        theme: buttons[2],
        account: buttons[3],
        text_to_speech: buttons[4],
        defaults: buttons[5],
        hotkeys: buttons[6],
    }

    const changelog = buttons[7]
    const logout = buttons[8]
    const closeButton = sidebar.parentNode.parentNode.previousSibling

    return { tabs, changelog, logout, closeButton }
}

const handleSettingsMobile = async (modal, sidebar) => {
    const buttons = sidebar.querySelectorAll('button')

    if (buttons.length < 9) {
        throw new Error('Not all required buttons are found')
    }

    const tabs = {
        ai_settings: buttons[1],
        interface: buttons[2],
        theme: buttons[3],
        account: buttons[4],
        text_to_speech: buttons[5],
        defaults: buttons[6],
    }

    const changelog = buttons[7]
    const logout = buttons[8]
    const closeButton = modal.querySelector('button[aria-label="Close"]')

    return { tabs, changelog, logout, closeButton }
}

const getPanel = async (modal, button, waitForFunction) => {
    DOM_UTILS.simulateClick(button)
    await MISC_UTILS.sleep(100)
    return await waitForFunction(modal)
}
