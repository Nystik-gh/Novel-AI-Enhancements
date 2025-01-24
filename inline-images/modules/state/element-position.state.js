/**
 * Creates a state manager for tracking element positions
 * @returns {Object} State manager instance
 */
function createElementPositionState() {
    const emitter = new NAIE.MISC.Emitter();
    /** @type {Map<number, {element: HTMLElement, index: number, position: {top: number, bottom: number, left: number, right: number}}>} */
    const positions = new Map();

    return {
        /**
         * Update or add an element's position state
         * @param {number} key - Numerical index key
         * @param {HTMLElement} element - Element reference
         * @param {number} index - Element index
         * @param {{top: number, bottom: number, left: number, right: number}} position - Element's position coordinates
         */
        updatePosition(key, element, index, position) {
            const previousState = positions.get(key);
            const newState = { element, index, position };
            
            positions.set(key, newState);
            
            // Emit change event if state changed
            if (!previousState || 
                previousState.index !== index || 
                previousState.position.top !== position.top ||
                previousState.position.bottom !== position.bottom ||
                previousState.position.left !== position.left ||
                previousState.position.right !== position.right ||
                previousState.element !== element) {
                emitter.emit('positionChanged', key, newState, previousState);
            }
        },

        /**
         * Get position state for a key
         * @param {number} key 
         * @returns {{element: HTMLElement, index: number, position: {top: number, bottom: number, left: number, right: number}} | undefined}
         */
        getPosition(key) {
            return positions.get(key);
        },

        /**
         * Get all positions
         * @returns {Map<number, {element: HTMLElement, index: number, position: {top: number, bottom: number, left: number, right: number}}>}
         */
        getAllPositions() {
            return positions;
        },

        /**
         * Remove position state for a key
         * @param {number} key 
         */
        removePosition(key) {
            const previousState = positions.get(key);
            if (previousState) {
                positions.delete(key);
                emitter.emit('positionRemoved', key, previousState);
            }
        },

        /**
         * Clear all position states
         */
        clear() {
            positions.clear();
            emitter.emit('cleared');
        },

        /**
         * Subscribe to state events
         * @param {string} event - Event name
         * @param {Function} callback - Event handler
         */
        on(event, callback) {
            emitter.on(event, callback);
        },

        /**
         * Subscribe to state events for a specific key
         * @param {string} event - Event name
         * @param {number} key - Key to filter events for
         * @param {Function} callback - Event handler
         */
        onKey(event, key, callback) {
            emitter.on(event, (...args) => {
                // For events that pass key as first argument (positionChanged, positionRemoved)
                if (args[0] === key) {
                    callback(...args);
                }
            });
        },

        /**
         * Unsubscribe from state events
         * @param {string} event - Event name
         * @param {Function} callback - Event handler to remove
         */
        off(event, callback) {
            emitter.off(event, callback);
        }
    };
}
