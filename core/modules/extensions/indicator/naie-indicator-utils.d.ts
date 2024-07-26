/**
 * An object that controls the NAIE indicator element
 *
 * @interface
 */
interface NAIEStatusIndicator {
    displayMessage(message: string): void
}

/**
 * An interface defining functions for NAIE controls
 *
 * @interface
 */
interface NAIEIndicatorUtils {
    createNAIEindicatorElement(): HTMLElement
    getNAIEindicator(): HTMLElement
    createMessageManager(): {
        pushMessage(message: string): void
        popMessage(): string
        hasMessages(): boolean
    }
    createIndicatorManager(logContainer: HTMLElement, maxRows: number, duration?: number): NAIEStatusIndicator
    createNAIEIndicator(): NAIEStatusIndicator
}
