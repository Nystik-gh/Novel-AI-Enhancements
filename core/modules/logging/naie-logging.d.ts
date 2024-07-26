type LogLevel = 'none' | 'debug' | 'info' | 'warn' | 'error'

/**
 * An interface defining logging functions for NAIE
 *
 * @interface
 */
interface LoggingUtils {
    /**
     * Sets the log level in localStorage.
     * @param {LogLevel} level - The log level to set. Accepted values are 'none', 'debug', 'info', 'warn', 'error'.
     * @throws {Error} Throws an error if the log level is invalid.
     */
    setLogLevel(level: LogLevel): void

    /**
     * Gets the current log level from localStorage.
     * @returns {LogLevel} The current log level. Defaults to 'none' if not set.
     */
    getLogLevel(): LogLevel

    /**
     * Checks if the current log level is 'debug'.
     * @returns {boolean} True if the current log level is 'debug', false otherwise.
     */
    isDebugMode(): boolean

    /**
     * Creates a logger object with methods for different log levels.
     * @param {LogLevel} level - The log level to create the logger for. Accepted values are 'debug', 'info', 'warn', 'error'.
     * @returns {Object} A logger object with methods: debug, info, warn, error. Methods are no-ops if the log level is below the specified level.
     */
    createLogger(level: LogLevel): {
        debug: (...args: any[]) => void
        info: (...args: any[]) => void
        warn: (...args: any[]) => void
        error: (...args: any[]) => void
    }

    /**
     * Gets a logger object based on the current log level from localStorage.
     * @returns {Object} A logger object with methods: debug, info, warn, error.
     */
    getLogger(): {
        debug: (...args: any[]) => void
        info: (...args: any[]) => void
        warn: (...args: any[]) => void
        error: (...args: any[]) => void
    }
}
