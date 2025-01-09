/**
 * Internal function to initialize all control templates
 * Each template's initialization is self-contained and independent
 */
const controls_initializeTemplates = async () => {
    const logger = NAIE.LOGGING.getLogger()
    logger.debug('Initializing control templates')

    try {
        await controls_initSelectTemplate()
        // Future template initializations would go here
        // Each should handle its own setup/cleanup
        
        logger.debug('Control templates initialized successfully')
    } catch (error) {
        logger.error('Failed to initialize control templates:', error)
        throw error
    }
}
