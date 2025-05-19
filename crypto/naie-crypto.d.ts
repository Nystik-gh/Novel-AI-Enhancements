import '../types/novel-ai/userdata.d.ts'
import '../types/novel-ai/keystore.d.ts'

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
    sodiumInstance: any;
    decryptObject: (data: any) => Promise<any>;
    decompressDecryptObject: (data: any) => Promise<any>;
    encryptObject: (data: any) => Promise<any>;
    encryptCompressObject: (data: any) => Promise<any>;
}

type NAIEWithCrypto = NAIE & {
    CRYPTO: NAIECrypto
}