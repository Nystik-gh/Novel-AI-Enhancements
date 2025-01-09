interface SelectOption {
    title: string
    value: string
}

/**
 * An interface defining functions for NAIE controls
 *
 * @interface
 */
interface NAIEControls {
    Select: {
        /**
         * Creates a custom select control element with options and handles user interactions.
         *
         * @param {SelectOption[]} options - Array of options with `title` and `value` properties.
         * @param {string} selectedValue - The value of the initially selected option.
         * @param {(value: string) => void} onChange - Function called with the selected value when an option is chosen.
         *
         * @returns {HTMLElement} The custom select control element.
         */
        constructSelectControl(options: SelectOption[], selectedValue: string, onChange: (value: string) => void): HTMLElement
    }
}
