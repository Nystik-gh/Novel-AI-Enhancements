/**
 * Available log levels in order of verbosity
 */
type LogLevel = 'none' | 'debug' | 'info' | 'warn' | 'error'

/**
 * Function signature for log methods
 */
type LogMethod = {
    (message: string): void
    (message: string, ...args: any[]): void
}

/**
 * Logger instance with methods for each log level
 */
interface Logger {
    readonly debug: LogMethod
    readonly info: LogMethod
    readonly warn: LogMethod
    readonly error: LogMethod
}

/**
 * Core logging utilities
 * @interface
 */
interface LoggingUtils {
    /**
     * Sets the global log level in localStorage
     * @throws {Error} If level is invalid
     */
    setLogLevel(level: LogLevel): void

    /**
     * Gets the current global log level
     * @returns Current log level, defaults to 'none' if not set
     */
    getLogLevel(): LogLevel

    /**
     * Checks if debug logging is enabled
     */
    isDebugMode(): boolean

    /**
     * Creates a logger instance with the specified minimum log level
     * Messages below this level will be no-ops
     */
    createLogger(level: LogLevel): Logger

    /**
     * Gets a logger instance using the global log level
     */
    getLogger(): Logger
}
