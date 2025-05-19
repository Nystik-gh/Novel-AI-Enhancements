// keystore state

interface KeystoreState {
    getKeystore(): UserKeystore;
    setKeystore(newKeystore: UserKeystore): void;
    getKey(keyId: string): Promise<string>;
}