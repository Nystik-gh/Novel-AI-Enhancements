// Internal stages not exposed to external scripts
const INTERNAL_STAGES = {
    INTERNAL: 'internal'
}

// Public stages that can be used by external scripts
const STAGES = {
    EARLY: 'early',
    MAIN: 'main',
    LATE: 'late'
}

const ALL_STAGES = { ...INTERNAL_STAGES, ...STAGES }

const DEFAULT_TIMEOUT = 10000 // 10 seconds
let currentStage = null

// Initialize hook storage
const hooks = new Map()
for (const stage of Object.values(ALL_STAGES)) {
    hooks.set(stage, [])
}

const runHookWithTimeout = async (hook) => {
    try {
        await Promise.race([
            hook.callback(),
            new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Hook ${hook.id} timed out after ${hook.timeout}ms`))
                }, hook.timeout)
            })
        ])
        return null
    } catch (error) {
        const hookError = {
            hookId: hook.id,
            error,
            stage: currentStage,
            timeoutError: error.message.includes('timed out')
        }
        return hookError
    }
}

const runStage = async (stage) => {
    const logger = LOGGING_UTILS.getLogger()
    currentStage = stage
    const stageHooks = hooks.get(stage) || []
    const errors = []

    if (stageHooks.length === 0) {
        logger.debug(`No hooks registered for stage: ${stage}`)
        return errors
    }

    logger.debug(`Running preflight stage: ${stage}`)

    for (const hook of stageHooks) {
        logger.debug(`Running hook: ${hook.id}`)
        const error = await runHookWithTimeout(hook)
        if (error) {
            errors.push(error)
            logger.error(`Hook ${hook.id} failed:`, error)
        }
    }

    return errors
}

const preflight_registerHook = (stage, id, priority, callback, timeout = DEFAULT_TIMEOUT) => {
    const logger = LOGGING_UTILS.getLogger()

    // Prevent external scripts from using internal stages
    if (INTERNAL_STAGES[stage]) {
        throw new Error(`Stage '${stage}' is reserved for internal use`)
    }

    if (!hooks.has(stage)) {
        throw new Error(`Invalid stage: ${stage}`)
    }

    const stageHooks = hooks.get(stage)
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

    logger.debug(`Registered preflight hook: ${id} in stage ${stage}`)
}
