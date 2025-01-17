interface UserPriority {
    maxPriorityActions: number;
    nextRefillAt: number;
    taskPriority: number;
}

interface UserSubscriptionPerks {
    maxPriorityActions: number;
    startPriority: number;
    moduleTrainingSteps: number;
    unlimitedMaxPriority: boolean;
    voiceGeneration: boolean;
    imageGeneration: boolean;
    unlimitedImageGeneration: boolean;
    unlimitedImageGenerationLimits: any[];
    contextTokens: number;
}

interface UserTrainingSteps {
    fixedTrainingStepsLeft: number;
    purchasedTrainingSteps: number;
}

interface UserSubscription {
    tier: number;
    active: boolean;
    expiresAt: number;
    perks: UserSubscriptionPerks;
    paymentProcessorData: any;
    trainingStepsLeft: UserTrainingSteps;
    accountType: number;
    isGracePeriod: boolean;
}

interface UserInformation {
    emailVerified: boolean;
    emailVerificationLetterSent: boolean;
    hasPlaintextEmail: boolean;
    allowMarketingEmails: boolean;
    trialActivated: boolean;
    trialActionsLeft: number;
    trialImagesLeft: number;
    accountCreatedAt: number;
    banStatus: string;
    banMessage: string | null;
}

interface UserData {
    priority: UserPriority;
    subscription: UserSubscription;
    keystore: UserKeystore;
    /** JSON */
    settings: string;
    information: UserInformation;
}

// settings (received as JSON)

interface UserThemeFonts {
    default: string;
    code: string;
    field: string;
    headings: string;
    selectedHeadings: string;
    selectedDefault: string;
}

interface UserThemeColors {
    bg0: string;
    bg1: string;
    bg2: string;
    bg3: string;
    textHeadings: string;
    textMain: string;
    textHeadingsOptions: string[];
    textMainOptions: string[];
    textDisabled: string;
    textPlaceholder: string;
    warning: string;
    textHighlight: string;
    textPrompt: string;
    textUser: string;
    textEdit: string;
    textAI: string;
}

interface UserThemeBreakpoints {
    mobile: string;
    desktop: string;
}

interface UserTheme {
    name: string;
    fonts: UserThemeFonts;
    colors: UserThemeColors;
    breakpoints: UserThemeBreakpoints;
    transitions: {
        interactive: string;
    };
    global: string;
}

interface NAIESettings {
    showBreadcrumbs: boolean;
}

interface UserSettings {
    settingsVersion: number;
    forceModelUpdate: number;
    model: number;
    tutorialSeen: boolean;
    useEditorV2: boolean;
    penName: string;
    imageModelUpdate: number;
    stableLicenseAgree: boolean;
    libraryCompactView: boolean;
    showDebug: boolean;
    naie_settings: NAIESettings;
    minibar: boolean;
    siteTheme: UserTheme;
    newsletterModalShown: boolean;
    sortLocalOnTop: boolean;
    sortFavoritesOnTop: boolean;
}