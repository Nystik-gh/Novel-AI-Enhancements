interface UserKeystore {
    /** Encrypted keystore */
    keystore: string;
    changeIndex: number;
}

interface DecryptedKeystore {
    version: number;
    nonce: number[];
    sdata: number[];
}