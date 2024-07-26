const logging_setLogLevel = (level) => {
    const acceptableLevels = ['none', 'debug', 'info', 'warn', 'error']
    if (acceptableLevels.includes(level)) {
        localStorage.setItem('naie_log_level', level)
    } else {
        throw new Error('Invalid log level')
    }
}

const logging_getLogLevel = () => {
    return localStorage.getItem('naie_log_level') || 'none'
}

const logging_isDebugMode = () => {
    return logging_getLogLevel() === 'debug'
}

const logging_createLogger = (level) => {
    const levels = ['debug', 'info', 'warn', 'error']
    const levelIndex = levels.indexOf(level)

    if (level === 'none' || levelIndex === -1) {
        return {
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
        }
    }

    const logger = {}

    levels.forEach((currentLevel, index) => {
        if (index >= levelIndex) {
            switch (currentLevel) {
                case 'debug':
                    logger.debug = (...args) => console.log('NAIE DEBUG:', ...args)
                    break
                case 'info':
                    logger.info = (...args) => console.info('NAIE INFO:', ...args)
                    break
                case 'warn':
                    logger.warn = (...args) => console.warn('NAIE WARNING:', ...args)
                    break
                case 'error':
                    logger.error = (...args) => console.error('NAIE ERROR:', ...args)
                    break
            }
        } else {
            logger[currentLevel] = () => {}
        }
    })

    return logger
}

const logging_getLogger = () => logging_createLogger(logging_getLogLevel())
