interface EncryptionObject {
    meta: string;
    data: string;
}

interface DecryptionObject {
    meta: string;
    data: string;
}

interface KeyMap {
    [key: string]: number[];
}

type GetDecryptToken = () => string;

type EncryptObject = (obj: EncryptionObject, keys: KeyMap) => Promise<string>;
type DecryptObject = (obj: DecryptionObject, keys: KeyMap) => Promise<any>;
type EncryptCompressObject = (obj: EncryptionObject, keys: KeyMap) => Promise<string>;
type DecompressDecryptObject = (obj: DecryptionObject, keys: KeyMap) => Promise<any>;

interface NAIECrypto {
    init: () => {} 
}