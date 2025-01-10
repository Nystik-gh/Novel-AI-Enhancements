/**
 * Maximum time to wait for scripts to become ready
 */
const SCRIPT_READY_TIMEOUT = 1000 // Max wait time for scripts

/** @type {NAIEInternal} */
const NAIE_INTERNAL = {
    readyScripts: new Set(),
    registeredScripts: new Set(),
    isPreflightStarted: false,
    isWaitingForScripts: false,
    preflight: {
        runStages: preflight_runStages
    }
}

/**
 * Check if all registered scripts have marked themselves as ready
 * @returns {boolean} True if all scripts are ready
 */
const checkAllScriptsReady = () => {
    const { readyScripts, registeredScripts } = NAIE_INTERNAL
    return readyScripts.size === registeredScripts.size
}

/**
 * Start waiting for scripts to register and become ready
 * After SCRIPT_READY_TIMEOUT, preflight will run even if not all scripts are ready
 * @returns {Promise<void>} Promise that resolves when preflight starts
 */
const internal_startWaitingForScripts = async () => {
    const logger = LOGGING_UTILS.getLogger()
    if (NAIE_INTERNAL.isWaitingForScripts || NAIE_INTERNAL.isPreflightStarted) return

    NAIE_INTERNAL.isWaitingForScripts = true
    logger.debug('Starting to wait for scripts')

    const startTime = Date.now()
    
    while (Date.now() - startTime < SCRIPT_READY_TIMEOUT) {
        if (checkAllScriptsReady()) {
            NAIE_INTERNAL.isPreflightStarted = true
            await NAIE_INTERNAL.preflight.runStages()
            return
        }
        await new Promise(r => setTimeout(r, 50))
    }

    // Timeout reached, run preflight anyway
    logger.warn(
        'Script registration timeout reached. Some scripts may not be ready:',
        {
            registered: Array.from(NAIE_INTERNAL.registeredScripts),
            ready: Array.from(NAIE_INTERNAL.readyScripts)
        }
    )
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
    LOGGING_UTILS.getLogger().info("registering script", scriptId)
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
    LOGGING_UTILS.getLogger().info("script reports ready", scriptId)
    NAIE_INTERNAL.readyScripts.add(scriptId)
}

/** @type {NAIECore} */
const CORE_UTILS = {
    registerScript,
    markScriptReady
}
