const showIndicator = async (text) => {
    // Get the core status indicator
    const indicator = NAIE.statusIndicator
    
    // Display the message
    indicator.displayMessage(text)
    
    // If you need to wait for the message to clear
    return new Promise((resolve) => {
        setTimeout(resolve, 3000)
    })
}
