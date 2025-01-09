/**
 * Represents a modal dialog in the NAI interface
 */
interface NAIEModal {
    /**
     * The modal element itself
     */
    modal: HTMLElement;

    /**
     * The overlay element that contains the modal
     */
    overlay: HTMLElement;

    /**
     * The close button element for the modal
     */
    closeButton: HTMLElement;
}

/**
 * Function that determines if a modal matches specific criteria
 */
type ModalPredicate = (modal: NAIEModal) => boolean;

/**
 * Event handler for modal events
 */
type ModalEventHandler = (modal: NAIEModal) => void;

/**
 * Observer service for detecting and interacting with NAI modals
 * 
 * @interface
 */
interface NAIEModalObserver {
    /**
     * Event emitter for modal-related events
     */
    emitter: MiscEmitter;

    /**
     * The underlying MutationObserver that watches for modal changes
     */
    observer: MutationObserver;

    /**
     * Wait for a specific modal to appear that matches the given predicate
     * 
     * @param predicate - Function that determines if a modal matches what we're looking for
     * @param timeout - Maximum time to wait for the modal in milliseconds
     * @returns Promise that resolves with the modal data when found, or rejects on timeout
     */
    waitForSpecificModal(predicate: ModalPredicate, timeout?: number): Promise<NAIEModal>;
}
