/**
 * An interface defining functions for the NAIE loader
 *
 * @interface
 */
interface NAIELoader {
    /**
     * Creates and displays a loader element to indicate loading state, and provides a method to remove it.
     *
     * @param {HTMLElement} app - Should be the #app container
     *
     * @returns {{ unlock: () => void }} lock object
     */
    lockLoader(app: HTMLElement): { unlock(): void }
}
