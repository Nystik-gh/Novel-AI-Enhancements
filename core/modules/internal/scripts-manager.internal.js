/**
 * Maximum time to wait for initial script registration
 */
const SCRIPT_REGISTRATION_TIMEOUT = 4000 // Max wait time for scripts to register

/**
 * Maximum time to wait for registered scripts to become ready
 */
const SCRIPT_READY_TIMEOUT = 4000 // Max wait time for scripts to become ready

/** @type {NAIEInternal} */
const NAIE_INTERNAL = {
    readyScripts: new Set(),
    registeredScripts: new Set(),
    isPreflightStarted: false,
    isWaitingForScripts: false,
    preflight: {
        runStages: preflight_runStages,
    },
}

/**
 * Check if all registered scripts have marked themselves as ready
 * @returns {boolean} True if all scripts are ready
 */
const checkAllScriptsReady = () => {
    const { readyScripts, registeredScripts } = NAIE_INTERNAL
    return readyScripts.size === registeredScripts.size && registeredScripts.size > 0
}

/**
 * Start waiting for scripts to register and become ready
 * Two-phase process:
 * 1. Wait up to SCRIPT_REGISTRATION_TIMEOUT for scripts to register
 * 2. Wait up to SCRIPT_READY_TIMEOUT for registered scripts to become ready
 * @returns {Promise<void>} Promise that resolves when preflight starts
 */
const internal_startWaitingForScripts = async () => {
    const logger = LOGGING_UTILS.getLogger()
    if (NAIE_INTERNAL.isWaitingForScripts || NAIE_INTERNAL.isPreflightStarted) return

    NAIE_INTERNAL.isWaitingForScripts = true
    logger.debug('Starting to wait for script registration', Date.now())

    // Phase 1: Wait for scripts to register
    const registrationStartTime = Date.now()
    while (Date.now() - registrationStartTime < SCRIPT_REGISTRATION_TIMEOUT) {
        if (NAIE_INTERNAL.registeredScripts.size > 0) {
            break // At least one script has registered
        }
        await new Promise((r) => setTimeout(r, 50))
    }

    // Log registration phase results
    logger.debug('Script registration phase complete', {
        registered: Array.from(NAIE_INTERNAL.registeredScripts),
        timeElapsed: Date.now() - registrationStartTime,
    })

    // Phase 2: Wait for registered scripts to become ready
    logger.debug('Starting to wait for scripts to become ready', Date.now())
    const readyStartTime = Date.now()
    while (Date.now() - readyStartTime < SCRIPT_READY_TIMEOUT) {
        if (checkAllScriptsReady()) {
            NAIE_INTERNAL.isPreflightStarted = true
            logger.debug('All scripts ready, starting preflight', {
                registered: Array.from(NAIE_INTERNAL.registeredScripts),
                ready: Array.from(NAIE_INTERNAL.readyScripts),
            })
            await NAIE_INTERNAL.preflight.runStages()
            return
        }
        await new Promise((r) => setTimeout(r, 50))
    }

    // Timeout reached, run preflight anyway
    logger.warn('Script ready timeout reached. Some scripts may not be ready:', {
        registered: Array.from(NAIE_INTERNAL.registeredScripts),
        ready: Array.from(NAIE_INTERNAL.readyScripts),
        timeElapsed: Date.now() - readyStartTime,
    })
    NAIE_INTERNAL.isPreflightStarted = true
    await NAIE_INTERNAL.preflight.runStages()
}

/**
 * Register a feature script with NAIE
 * Must be called before markScriptReady
 * @param {string} scriptId Unique identifier for the script
 * @throws {Error} If script tries to register after preflight started
 */
const registerScript = (scriptId) => {
    if (NAIE_INTERNAL.isPreflightStarted) {
        throw new Error(`Script ${scriptId} tried to register after preflight started`)
    }
    LOGGING_UTILS.getLogger().info('registering script', scriptId)
    NAIE_INTERNAL.registeredScripts.add(scriptId)
}

/**
 * Mark a feature script as ready for preflight
 * Script must be registered first
 * @param {string} scriptId Unique identifier for the script
 * @returns {Promise<void>}
 * @throws {Error} If script is not registered
 */
const markScriptReady = async (scriptId) => {
    if (!NAIE_INTERNAL.registeredScripts.has(scriptId)) {
        throw new Error(`Script ${scriptId} not registered`)
    }
    LOGGING_UTILS.getLogger().info('script reports ready', scriptId)
    NAIE_INTERNAL.readyScripts.add(scriptId)
}

/** @type {NAIECore} */
const CORE_UTILS = {
    registerScript,
    markScriptReady,
}
