// Functions for creating lorebook entries and categories

const sortingPrefix = 'Ξ'
const NAIE_DATA_LB_CATEGORY_NAME = 'NAIE_data'
const NAIE_IMAGE_STORE_ENTRY_NAME = 'NAIE-inline-image-store'

/**
 * Creates a new NAIE data category
 * @returns {LorebookCategory}
 */
const createLorebookCategory = () => {
    const generateId = () => crypto.randomUUID()

    return {
        name: `${sortingPrefix}${NAIE_DATA_LB_CATEGORY_NAME}`,
        id: generateId(),
        enabled: false,
        createSubcontext: false,
        subcontextSettings: {
            text: '',
            contextConfig: {
                prefix: '',
                suffix: '\n',
                tokenBudget: 1,
                reservedTokens: 0,
                budgetPriority: 400,
                trimDirection: 'trimBottom',
                insertionType: 'newline',
                maximumTrimType: 'sentence',
                insertionPosition: -1,
            },
            lastUpdatedAt: Date.now(),
            displayName: 'New Lorebook Entry',
            id: generateId(),
            keys: [],
            searchRange: 1000,
            enabled: true,
            forceActivation: false,
            keyRelative: false,
            nonStoryActivatable: false,
            category: '',
            loreBiasGroups: [
                {
                    phrases: [],
                    ensureSequenceFinish: false,
                    generateOnce: true,
                    bias: 0,
                    enabled: true,
                    whenInactive: false,
                },
            ],
        },
        useCategoryDefaults: false,
        categoryDefaults: {
            text: '',
            contextConfig: {
                prefix: '',
                suffix: '\n',
                tokenBudget: 1,
                reservedTokens: 0,
                budgetPriority: 400,
                trimDirection: 'trimBottom',
                insertionType: 'newline',
                maximumTrimType: 'sentence',
                insertionPosition: -1,
            },
            lastUpdatedAt: Date.now(),
            displayName: 'New Lorebook Entry',
            id: generateId(),
            keys: [],
            searchRange: 1000,
            enabled: true,
            forceActivation: false,
            keyRelative: false,
            nonStoryActivatable: false,
            category: '',
            loreBiasGroups: [
                {
                    phrases: [],
                    ensureSequenceFinish: false,
                    generateOnce: true,
                    bias: 0,
                    enabled: true,
                    whenInactive: false,
                },
            ],
        },
        categoryBiasGroups: [
            {
                phrases: [],
                ensureSequenceFinish: false,
                generateOnce: true,
                bias: 0,
                enabled: true,
                whenInactive: false,
            },
        ],
        open: false,
    }
}

/**
 * Creates a new image store entry
 * @param {string} categoryId - ID of the parent category
 * @returns {LoreEntry}
 */
const createLorebookImageStore = (categoryId) => {
    const generateId = () => crypto.randomUUID()

    return {
        text: JSON.stringify({ images: [] }),
        contextConfig: {
            prefix: '',
            suffix: '\n',
            tokenBudget: 1,
            reservedTokens: 0,
            budgetPriority: 400,
            trimDirection: 'trimBottom',
            insertionType: 'newline',
            maximumTrimType: 'sentence',
            insertionPosition: -1,
        },
        lastUpdatedAt: Date.now(),
        displayName: NAIE_IMAGE_STORE_ENTRY_NAME,
        id: generateId(),
        keys: [NAIE_IMAGE_STORE_ENTRY_NAME],
        searchRange: 1000,
        enabled: false,
        forceActivation: false,
        keyRelative: false,
        nonStoryActivatable: false,
        category: categoryId,
        loreBiasGroups: [
            {
                phrases: [],
                ensureSequenceFinish: false,
                generateOnce: true,
                bias: 0,
                enabled: false,
                whenInactive: false,
            },
        ],
        hidden: false,
    }
}
