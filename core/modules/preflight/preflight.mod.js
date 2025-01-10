/***
 * @type {PreflightUtils}
 */
const PREFLIGHT_UTILS = {
    registerHook: preflight_registerHook
}

// Internal function to register hooks in internal stages
const registerInternalHook = (id, priority, callback, timeout = DEFAULT_TIMEOUT) => {
    const stageHooks = hooks.get(INTERNAL_STAGES.INTERNAL)
    const hook = {
        id,
        priority: priority || 0,
        callback,
        timeout
    }

    // Insert hook in priority order (higher priority first)
    const index = stageHooks.findIndex(h => (h.priority || 0) < (hook.priority || 0))
    if (index === -1) {
        stageHooks.push(hook)
    } else {
        stageHooks.splice(index, 0, hook)
    }
}

// Register core initialization in the internal stage
const registerCoreInit = () => {
    registerInternalHook(
        'core-initialization',
        100, // High priority to run first
        async () => {
            const logger = logging_getLogger()
            logger.debug('core-initialization')
            await controls_initializeTemplates()
            _statusIndicator = extensions_createNAIEIndicator()
        }
    )
}

// Internal function, called by core when all scripts are ready
const preflight_runStages = async () => {
    const logger = logging_getLogger()
    logger.debug('Starting NAIE preflight')

    registerCoreInit()

    const app = await dom_waitForElement('#app')
    logger.debug('app element', app)
    const loader = extensions_lockLoader(app)

    const errors = []
    
    try {
        // Run each stage, collecting errors
        errors.push(...await runStage(INTERNAL_STAGES.INTERNAL))
        _statusIndicator.displayMessage(
            `Initializing NAIE scripts...`
        )

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
            _statusIndicator.displayMessage(
                `NAIE scripts initialized successfully`
            )
        }
    } finally {
        logger.debug('unlocking loader')
        loader.unlock()
    }

    return errors
}
