/***
 * @type {PreflightUtils}
 */
const PREFLIGHT_UTILS = {
    registerHook: preflight_registerHook
}

// Internal function, called by core when all scripts are ready
const preflight_runStages = async () => {
    const logger = logging_getLogger()
    logger.debug('Starting NAIE preflight')

    const app = await waitForElement('#app')
    const loader = extensions_lockLoader(app)
    const errors = []
    
    try {
        // Run each stage, collecting errors
        errors.push(...await runStage(STAGES.EARLY))
        errors.push(...await runStage(STAGES.MAIN))
        errors.push(...await runStage(STAGES.LATE))

        // Report errors if any occurred
        if (errors.length > 0) {
            const timeouts = errors.filter(e => e.timeoutError)
            const failures = errors.filter(e => !e.timeoutError)
            
            logger.error(
                'Preflight completed with errors:',
                {
                    total: errors.length,
                    timeouts: timeouts.length,
                    failures: failures.length,
                    errors: errors.map(e => ({
                        id: e.hookId,
                        stage: e.stage,
                        type: e.timeoutError ? 'timeout' : 'error',
                        message: e.error.message
                    }))
                }
            )

            // Show user-friendly notification
            _statusIndicator.displayMessage(
                `Some features failed to initialize: ${errors.map(e => e.hookId).join(', ')}`
            )
        } else {
            logger.debug('Preflight completed successfully')
        }
    } finally {
        loader.unlock()
    }

    return errors
}
