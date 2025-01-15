/**
 * @param {LogLevel} level
 * @throws {Error} If level is invalid
 */
const logging_setLogLevel = (level) => {
    const acceptableLevels = ['none', 'debug', 'info', 'warn', 'error']
    if (acceptableLevels.includes(level)) {
        localStorage.setItem('naie_log_level', level)
    } else {
        throw new Error('Invalid log level')
    }
}

/** @returns {LogLevel} */
const logging_getLogLevel = () => {
    return localStorage.getItem('naie_log_level') || 'none'
}

/** @returns {boolean} */
const logging_isDebugMode = () => {
    return logging_getLogLevel() === 'debug'
}

/**
 * Creates a no-op logger
 * @returns {Logger}
 */
const createNoOpLogger = () => ({
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {}
})

/**
 * Creates a log method
 * @param {string} level 
 * @returns {LogMethod}
 */
const createLogMethod = (level) => {
    const logFn = level === 'debug' ? console.log 
                : level === 'info' ? console.info
                : level === 'warn' ? console.warn
                : console.error

    return (message, ...args) => {
        logFn(`NAIE ${level.toUpperCase()}:`, message, ...args)
    }
}

/**
 * @param {LogLevel} level
 * @returns {Logger}
 */
const logging_createLogger = (level) => {
    const levels = ['debug', 'info', 'warn', 'error']
    const levelIndex = levels.indexOf(level)

    if (level === 'none' || levelIndex === -1) {
        return createNoOpLogger()
    }

    /** @type {Logger} */
    const logger = {}

    levels.forEach((currentLevel, index) => {
        if (index >= levelIndex) {
            logger[currentLevel] = createLogMethod(currentLevel)
        } else {
            logger[currentLevel] = () => {}
        }
    })

    return logger
}

/** @returns {Logger} */
const logging_getLogger = () => logging_createLogger(logging_getLogLevel())
