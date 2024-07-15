const getSettingsButton = () => {
    return document.querySelector(settingsButtonSelector)
}

const waitForSettingsModal = async (timeout, hidden = false) => {
    const { modal, overlay } = await waitForModal(timeout)

    if (hidden) {
        overlay.style.display = 'none'
    }

    const sidebar = await waitForElement('.settings-sidebar', 15000)

    if (!sidebar) {
        throw new Error('No settings sidebar found')
    }

    const { tabs, changelog, logout, closeButton } = isMobileView()
        ? await handleSettingsMobile(modal, sidebar)
        : await handleSettingsDesktop(modal, sidebar)

    return {
        modal,
        overlay,
        closeButton,
        tabs,
        extra: { changelog, logout },
        panels: {
            //getAISettingsPanel: () => getPanel(tabs.ai_settings, waitForAISettingsPanel),
            //getInterfacePanel: () => getPanel(tabs.interface, waitForInterfacePanel),
            getThemePanel: () => getPanel(modal, tabs.theme, waitForThemePanel),
            //getAccountPanel: () => getPanel(tabs.account, waitForAccountPanel),
            //getTextToSpeechPanel: () => getPanel(tabs.text_to_speech, waitForTextToSpeechPanel),
            //getDefaultsPanel: () => getPanel(tabs.defaults, waitForDefaultsPanel),
            //getHotkeysPanel: () => getPanel(tabs.hotkeys, waitForHotkeysPanel),
        },
    }
}

const handleSettingsDesktop = async (modal, sidebar) => {
    do {
        await sleep(50)
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

    const closeButton = findElementWithMaskImage(modal.querySelectorAll('button > div'), ['cross', '.svg'])?.[0]

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

    const closeButton = findElementWithMaskImage(modal.querySelectorAll('button > div'), ['cross', '.svg'])?.[0]

    return { tabs, changelog, logout, closeButton }
}

const getPanel = async (modal, button, waitForFunction) => {
    const panelPromise = waitForFunction(modal)

    simulateClick(button) // Simulate the click on the button to show the panel

    const panel = await panelPromise

    return panel
}
