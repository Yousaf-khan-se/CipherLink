/**
 * CipherLink Cryptography Utilities
 * 
 * This module implements end-to-end encryption using:
 * - ECDH (Elliptic Curve Diffie-Hellman) for key exchange (P-521 curve / secp521r1)
 * - AES-GCM for symmetric encryption (256-bit)
 * - PBKDF2 for password-based key derivation (SHA-512)
 * - SHA-256 for hashing
 * 
 * Uses the Web Crypto API for cryptographic operations, which provides:
 * - Hardware-accelerated cryptography
 * - Secure random number generation
 * - Protection against timing attacks
 */

// ============================================================================
// Configuration Constants
// ============================================================================

const ECDH_CURVE = 'P-521'; // secp521r1 - 521-bit elliptic curve
const AES_ALGORITHM = 'AES-GCM';
const AES_KEY_LENGTH = 256;
const PBKDF2_ITERATIONS_CLIENT = 25000; // Client-side iterations
const PBKDF2_HASH = 'SHA-512';
const IV_LENGTH = 12; // 96 bits for AES-GCM

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert ArrayBuffer to Base64 string
 */
export function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Convert string to ArrayBuffer (UTF-8)
 */
export function stringToArrayBuffer(str) {
    return new TextEncoder().encode(str);
}

/**
 * Convert ArrayBuffer to string (UTF-8)
 */
export function arrayBufferToString(buffer) {
    return new TextDecoder().decode(buffer);
}

/**
 * Convert ArrayBuffer to Hex string
 */
export function arrayBufferToHex(buffer) {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Convert Hex string to ArrayBuffer
 */
export function hexToArrayBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
}

/**
 * Generate cryptographically secure random bytes
 */
export function getRandomBytes(length) {
    return crypto.getRandomValues(new Uint8Array(length));
}

// ============================================================================
// Hashing Functions
// ============================================================================

/**
 * Compute SHA-256 hash of data
 * @param {string|ArrayBuffer} data - Data to hash
 * @returns {Promise<string>} Hex-encoded hash
 */
export async function sha256(data) {
    const buffer = typeof data === 'string' ? stringToArrayBuffer(data) : data;
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return arrayBufferToHex(hashBuffer);
}

/**
 * Compute SHA-512 hash of data
 * @param {string|ArrayBuffer} data - Data to hash
 * @returns {Promise<string>} Hex-encoded hash
 */
export async function sha512(data) {
    const buffer = typeof data === 'string' ? stringToArrayBuffer(data) : data;
    const hashBuffer = await crypto.subtle.digest('SHA-512', buffer);
    return arrayBufferToHex(hashBuffer);
}

// ============================================================================
// PBKDF2 - Password-Based Key Derivation
// ============================================================================

/**
 * Derive a key from password using PBKDF2
 * Used for:
 * - Hashing passwords before sending to server (25,000 iterations)
 * - Deriving encryption key for private key storage
 * 
 * @param {string} password - The password to derive from
 * @param {string} salt - Salt for the derivation
 * @param {number} iterations - Number of iterations (default: 25,000)
 * @param {number} keyLength - Output key length in bits (default: 512)
 * @returns {Promise<string>} Hex-encoded derived key
 */
export async function pbkdf2(password, salt, iterations = PBKDF2_ITERATIONS_CLIENT, keyLength = 512) {
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        stringToArrayBuffer(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );

    // Derive bits using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: stringToArrayBuffer(salt),
            iterations: iterations,
            hash: PBKDF2_HASH
        },
        keyMaterial,
        keyLength
    );

    return arrayBufferToHex(derivedBits);
}

/**
 * Derive AES key from password for encrypting private keys
 */
async function deriveAESKeyFromPassword(password, salt) {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        stringToArrayBuffer(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: stringToArrayBuffer(salt),
            iterations: PBKDF2_ITERATIONS_CLIENT,
            hash: PBKDF2_HASH
        },
        keyMaterial,
        { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

// ============================================================================
// ECDH - Elliptic Curve Diffie-Hellman Key Exchange
// ============================================================================

/**
 * Generate ECDH key pair
 * Uses P-521 curve (secp521r1) for maximum security
 * 
 * @returns {Promise<{publicKey: string, privateKey: string}>}
 *          JSON-encoded JWK format keys
 */
export async function generateECDHKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: ECDH_CURVE
        },
        true, // extractable - needed for export
        ['deriveKey', 'deriveBits']
    );

    // Export keys to JWK format
    const publicKeyJWK = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKeyJWK = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    return {
        publicKey: JSON.stringify(publicKeyJWK),
        privateKey: JSON.stringify(privateKeyJWK)
    };
}

/**
 * Import ECDH public key from JWK string
 */
export async function importECDHPublicKey(publicKeyJson) {
    const jwk = JSON.parse(publicKeyJson);
    return crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDH', namedCurve: ECDH_CURVE },
        true,
        []
    );
}

/**
 * Import ECDH private key from JWK string
 */
export async function importECDHPrivateKey(privateKeyJson) {
    const jwk = JSON.parse(privateKeyJson);
    return crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDH', namedCurve: ECDH_CURVE },
        true,
        ['deriveKey', 'deriveBits']
    );
}

/**
 * Derive shared secret using ECDH
 * The shared secret is the same whether computed with:
 * - Alice's private key + Bob's public key
 * - Bob's private key + Alice's public key
 * 
 * @param {string} privateKeyJson - Own private key (JWK JSON string)
 * @param {string} publicKeyJson - Other party's public key (JWK JSON string)
 * @returns {Promise<CryptoKey>} AES key derived from shared secret
 */
export async function deriveSharedSecret(privateKeyJson, publicKeyJson) {
    const privateKey = await importECDHPrivateKey(privateKeyJson);
    const publicKey = await importECDHPublicKey(publicKeyJson);

    // Derive an AES key from the ECDH shared secret
    return crypto.subtle.deriveKey(
        {
            name: 'ECDH',
            public: publicKey
        },
        privateKey,
        { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Derive shared secret as hex string (for channel ID generation)
 */
export async function deriveSharedSecretHex(privateKeyJson, publicKeyJson) {
    const privateKey = await importECDHPrivateKey(privateKeyJson);
    const publicKey = await importECDHPublicKey(publicKeyJson);

    const sharedBits = await crypto.subtle.deriveBits(
        {
            name: 'ECDH',
            public: publicKey
        },
        privateKey,
        256 // 256 bits
    );

    return arrayBufferToHex(sharedBits);
}

// ============================================================================
// AES-GCM Encryption/Decryption
// ============================================================================

/**
 * Encrypt data using AES-GCM
 * 
 * @param {string} plaintext - Data to encrypt
 * @param {CryptoKey} key - AES key
 * @returns {Promise<string>} Base64-encoded ciphertext (IV prepended)
 */
export async function aesEncrypt(plaintext, key) {
    const iv = getRandomBytes(IV_LENGTH);
    const plaintextBuffer = stringToArrayBuffer(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
        {
            name: AES_ALGORITHM,
            iv: iv
        },
        key,
        plaintextBuffer
    );

    // Prepend IV to ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypt data using AES-GCM
 * 
 * @param {string} ciphertextBase64 - Base64-encoded ciphertext (IV prepended)
 * @param {CryptoKey} key - AES key
 * @returns {Promise<string>} Decrypted plaintext
 */
export async function aesDecrypt(ciphertextBase64, key) {
    const combined = new Uint8Array(base64ToArrayBuffer(ciphertextBase64));

    // Extract IV and ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const plaintextBuffer = await crypto.subtle.decrypt(
        {
            name: AES_ALGORITHM,
            iv: iv
        },
        key,
        ciphertext
    );

    return arrayBufferToString(plaintextBuffer);
}

/**
 * Encrypt with derived shared secret
 */
export async function encryptWithSharedSecret(plaintext, privateKeyJson, publicKeyJson) {
    const sharedKey = await deriveSharedSecret(privateKeyJson, publicKeyJson);
    return aesEncrypt(plaintext, sharedKey);
}

/**
 * Decrypt with derived shared secret
 */
export async function decryptWithSharedSecret(ciphertext, privateKeyJson, publicKeyJson) {
    const sharedKey = await deriveSharedSecret(privateKeyJson, publicKeyJson);
    return aesDecrypt(ciphertext, sharedKey);
}

// ============================================================================
// Private Key Encryption (for storage)
// ============================================================================

/**
 * Encrypt private key for secure storage
 * Uses a passphrase derived from server auth hash + user password
 * 
 * @param {string} privateKeyJson - Private key in JWK format
 * @param {string} passphrase - Passphrase (serverAuth + password)
 * @param {string} salt - Salt for key derivation
 * @returns {Promise<string>} Encrypted private key (Base64)
 */
export async function encryptPrivateKey(privateKeyJson, passphrase, salt) {
    const key = await deriveAESKeyFromPassword(passphrase, salt);
    return aesEncrypt(privateKeyJson, key);
}

/**
 * Decrypt private key from storage
 * 
 * @param {string} encryptedPrivateKey - Encrypted private key (Base64)
 * @param {string} passphrase - Passphrase (serverAuth + password)
 * @param {string} salt - Salt for key derivation
 * @returns {Promise<string>} Private key in JWK format
 */
export async function decryptPrivateKey(encryptedPrivateKey, passphrase, salt) {
    const key = await deriveAESKeyFromPassword(passphrase, salt);
    return aesDecrypt(encryptedPrivateKey, key);
}

// ============================================================================
// Channel ID Generation
// ============================================================================

/**
 * Generate unique channel ID for private chat
 * Creates deterministic ID by hashing sorted public key hashes
 * Both users will generate the same channel ID
 * 
 * @param {string} publicKeyHash1 - First user's public key hash
 * @param {string} publicKeyHash2 - Second user's public key hash
 * @returns {Promise<string>} Channel ID (SHA-256 hash)
 */
export async function generateChannelId(publicKeyHash1, publicKeyHash2) {
    // Sort hashes to ensure same result regardless of order
    const sorted = [publicKeyHash1, publicKeyHash2].sort();
    const combined = sorted.join(':');
    return sha256(combined);
}

// ============================================================================
// Message Encryption/Decryption Helpers
// ============================================================================

/**
 * Encrypt a chat message for private channel
 * Encrypts: senderName, message, timestamp
 * 
 * @param {Object} messageData - Message data
 * @param {string} privateKeyJson - Sender's private key
 * @param {string} receiverPublicKeyJson - Receiver's public key
 * @returns {Promise<Object>} Encrypted message data
 */
export async function encryptMessage(messageData, privateKeyJson, receiverPublicKeyJson) {
    const sharedKey = await deriveSharedSecret(privateKeyJson, receiverPublicKeyJson);

    return {
        senderName: await aesEncrypt(messageData.senderName, sharedKey),
        message: await aesEncrypt(messageData.message, sharedKey),
        timestamp: await aesEncrypt(messageData.timestamp, sharedKey),
        channel: messageData.channel,
        senderPublicKeyHash: messageData.senderPublicKeyHash,
        receiverPublicKeyHash: messageData.receiverPublicKeyHash,
        messageType: 'encrypted'
    };
}

/**
 * Decrypt a chat message from private channel
 * 
 * @param {Object} encryptedMessage - Encrypted message data
 * @param {string} privateKeyJson - Own private key
 * @param {string} senderPublicKeyJson - Sender's public key
 * @returns {Promise<Object>} Decrypted message data
 */
export async function decryptMessage(encryptedMessage, privateKeyJson, senderPublicKeyJson) {
    try {
        const sharedKey = await deriveSharedSecret(privateKeyJson, senderPublicKeyJson);

        return {
            ...encryptedMessage,
            senderName: await aesDecrypt(encryptedMessage.senderName, sharedKey),
            message: await aesDecrypt(encryptedMessage.message, sharedKey),
            timestamp: await aesDecrypt(encryptedMessage.timestamp, sharedKey),
            decrypted: true
        };
    } catch (error) {
        console.error('Failed to decrypt message:', error);
        return {
            ...encryptedMessage,
            decrypted: false,
            decryptionError: true
        };
    }
}

// ============================================================================
// Verification Helpers
// ============================================================================

/**
 * Verify that a public key hash matches the public key
 */
export async function verifyPublicKeyHash(publicKeyJson, expectedHash) {
    const computedHash = await sha256(publicKeyJson);
    return computedHash === expectedHash;
}

/**
 * Generate fingerprint for public key verification
 * Returns a human-readable fingerprint for visual verification
 */
export async function generateFingerprint(publicKeyJson) {
    const hash = await sha256(publicKeyJson);
    // Format as groups of 4 hex characters
    return hash.match(/.{1,4}/g).slice(0, 8).join(' ').toUpperCase();
}

// ============================================================================
// Export all utilities
// ============================================================================

export default {
    // Utilities
    arrayBufferToBase64,
    base64ToArrayBuffer,
    stringToArrayBuffer,
    arrayBufferToString,
    arrayBufferToHex,
    hexToArrayBuffer,
    getRandomBytes,

    // Hashing
    sha256,
    sha512,

    // PBKDF2
    pbkdf2,

    // ECDH
    generateECDHKeyPair,
    importECDHPublicKey,
    importECDHPrivateKey,
    deriveSharedSecret,
    deriveSharedSecretHex,

    // AES
    aesEncrypt,
    aesDecrypt,
    encryptWithSharedSecret,
    decryptWithSharedSecret,

    // Private Key Storage
    encryptPrivateKey,
    decryptPrivateKey,

    // Channel
    generateChannelId,

    // Messages
    encryptMessage,
    decryptMessage,

    // Verification
    verifyPublicKeyHash,
    generateFingerprint
};
