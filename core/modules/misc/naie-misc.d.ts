/**
 * Event emitter class for handling event subscriptions and emissions
 */
interface MiscEmitter {
    /**
     * Subscribe to an event
     * @param event - The event name to subscribe to
     * @param callback - The callback function to execute when the event is emitted
     */
    on(event: string, callback: (...args: any[]) => void): void

    /**
     * Unsubscribe from an event
     * @param event - The event name to unsubscribe from
     * @param callback - The callback function to remove
     */
    off(event: string, callback: (...args: any[]) => void): void

    /**
     * Emit an event with optional data
     * @param event - The event name to emit
     * @param data - Optional data to pass to event handlers
     */
    emit(event: string, ...data: any[]): void
}

/**
 * An interface defining general utility functions for NAIE
 *
 * @interface
 */
interface MiscUtils {
    /**
     * Creates a new event emitter instance
     * @returns A new event emitter instance
     */
    Emitter: new () => MiscEmitter

    /**
     * Sleep for a specified duration
     * @param duration - Time to sleep in milliseconds
     * @returns A promise that resolves after the specified duration
     */
    sleep(duration: number): Promise<void>

    /**
     * Check if the current view is mobile
     * @returns True if the window width is <= 650px
     */
    isMobileView(): boolean

    /**
     * Check if an object is empty (has no own properties)
     * @param obj - The object to check
     * @returns True if the object has no own properties
     */
    isObjEmpty(obj: object): boolean

    /**
     * Add a global CSS style to the document
     * @param css - The CSS string to add
     */
    addGlobalStyle(css: string): void

    /**
     * Decode a base64 string
     * @param str - The base64 string to decode
     * @returns The decoded string
     */
    decodeBase64(str: string): string

    /**
     * Encode a string to base64
     * @param str - The string to encode
     * @returns The base64 encoded string
     */
    encodeBase64(str: string): string
}