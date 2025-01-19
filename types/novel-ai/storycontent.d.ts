interface EntityWrapper {
    changeIndex: number;
    data: string;
    id: string;
    lastUpdatedAt: number;
    meta: string;
    type: "storycontent" | "stories" | "shelf";
}

interface StoryContent {
    storyContentVersion: number;
    settings: {
        parameters: TextGenerationSettings;
        preset: string;
        trimResponses: boolean;
        banBrackets: boolean;
        prefix: string;
        dynamicPenaltyRange: boolean;
        prefixMode: number;
        mode: number;
        model: string;
    };
    story: {
        version: number;
        step: number;
        datablocks: DataBlock[];
        currentBlock: number;
        fragments: DataFragment[];
    };
    context: ContextEntry[];
    lorebook: Lorebook;
    storyContextConfig: ContextConfig;
    ephemeralContext: any[];
    contextDefaults: {
        ephemeralDefaults: EphemeralDefault[];
        loreDefaults: LoreEntry[];
    };
    settingsDirty: boolean;
    didGenerate: boolean;
    phraseBiasGroups: PhraseBiasGroup[];
    bannedSequenceGroups: BannedSequenceGroup[];
    nonce: Record<number, number>;
}

interface TextGenerationSettings {
    textGenerationSettingsVersion: number;
    temperature: number;
    max_length: number;
    min_length: number;
    top_k: number;
    top_p: number;
    top_a: number;
    typical_p: number;
    tail_free_sampling: number;
    repetition_penalty: number;
    repetition_penalty_range: number;
    repetition_penalty_slope: number;
    repetition_penalty_frequency: number;
    repetition_penalty_presence: number;
    repetition_penalty_default_whitelist: boolean;
    cfg_scale: number;
    cfg_uc: string;
    phrase_rep_pen: string;
    top_g: number;
    mirostat_tau: number;
    mirostat_lr: number;
    math1_temp: number;
    math1_quad: number;
    math1_quad_entropy_scale: number;
    min_p: number;
    order: OrderEntry[];
}

interface OrderEntry {
    id: string;
    enabled: boolean;
}

interface DataBlock {
    nextBlock: number[];
    prevBlock: number;
    origin: string;
    startIndex: number;
    endIndex: number;
    dataFragment: DataFragment;
    fragmentIndex: number;
    removedFragments: DataFragment[];
    chain: boolean;
}

interface DataFragment {
    data: string;
    origin: string;
}

interface ContextEntry {
    text: string;
    contextConfig: ContextConfig;
}

interface ContextConfig {
    prefix: string;
    suffix: string;
    tokenBudget: number;
    reservedTokens: number;
    budgetPriority: number;
    trimDirection: "trimBottom" | "trimTop" | "doNotTrim";
    insertionType: "newline";
    maximumTrimType: "sentence" | "newline";
    insertionPosition: number;
    allowInsertionInside?: boolean;
}

interface Lorebook {
    lorebookVersion: number;
    entries: LoreEntry[];
    settings: {
        orderByKeyLocations: boolean;
    };
    categories: LorebookCategory[];
}

interface LorebookCategory {
    name: string;
    id: string;
    enabled: boolean;
    createSubcontext: boolean;
    subcontextSettings: LoreEntry;
    useCategoryDefaults: boolean;
    categoryDefaults: LoreEntry;
    categoryBiasGroups: PhraseBiasGroup[];
    open: boolean;
}

interface LoreEntry {
    text: string;
    contextConfig: ContextConfig;
    lastUpdatedAt: number;
    displayName: string;
    id: string;
    keys: string[];
    searchRange: number;
    enabled: boolean;
    forceActivation: boolean;
    keyRelative: boolean;
    nonStoryActivatable: boolean;
    category: string;
    loreBiasGroups: PhraseBiasGroup[];
}

interface PhraseBiasGroup {
    phrases: string[];
    ensureSequenceFinish: boolean;
    generateOnce: boolean;
    bias: number;
    enabled: boolean;
    whenInactive: boolean;
}

interface ContextConfig {
    prefix: string;
    suffix: string;
    tokenBudget: number;
    reservedTokens: number;
    budgetPriority: number;
    trimDirection: "trimBottom" | "trimTop" | "doNotTrim";
    insertionType: "newline";
    maximumTrimType: "sentence" | "newline";
    insertionPosition: number;
}

interface EphemeralDefault {
    text: string;
    contextConfig: ContextConfig;
    startingStep: number;
    delay: number;
    duration: number;
    repeat: boolean;
    reverse: boolean;
}

interface BannedSequenceGroup {
    sequences: string[];
    enabled: boolean;
}
