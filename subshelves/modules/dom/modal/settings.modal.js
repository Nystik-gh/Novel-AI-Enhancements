const getSettingsButton = () => {
    return document.querySelector('button[aria-label="Open Settings"]')
}

const waitForSettingsModal = async (timeout) => {
    console.log('waitForSettingsModal')
    const { modal, overlay } = await waitForModal(timeout)

    const sidebar = await waitForElement('.settings-sidebar', 1000)

    if (!sidebar) {
        throw new Error('No settings sidebar found')
    }

    console.log('sidebar', sidebar.cloneNode(true), sidebar.firstElementChild?.tagName)

    const { tabs, changelog, logout, closeButton } =
        document.querySelectorAll('button[href="/image"]').length === 2
            ? await handleSettingsMobile(sidebar)
            : await handleSettingsDesktop(modal, sidebar)

    console.log('tabs', tabs, changelog, logout)

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
    console.log('handle settings desktop')

    do {
        await waitForElement('nullelement', 50)
    } while (sidebar?.firstChild?.nextSibling?.querySelectorAll('button').length !== 7)

    const buttons = sidebar.querySelectorAll('button')

    if (buttons.length !== 9) {
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

const handleSettingsMobile = async (sidebar) => {
    console.log('handle settings mobile')
    const buttons = sidebar.querySelectorAll('button')

    if (buttons.length !== 9) {
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

    return { tabs, changelog, logout, close }
}

const getPanel = async (modal, button, waitForFunction) => {
    const panelPromise = waitForFunction(modal)

    simulateClick(button) // Simulate the click on the button to show the panel

    const panel = await panelPromise

    return panel
}
