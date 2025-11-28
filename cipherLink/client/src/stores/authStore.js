import { create } from 'zustand';
import { authApi } from '../lib/api';
import { storage, secureStorage } from '../lib/utils';
import {
    pbkdf2,
    sha256,
    generateECDHKeyPair,
    encryptPrivateKey,
    decryptPrivateKey,
    getRandomBytes,
    arrayBufferToBase64
} from '../lib/crypto';
import socketService from '../lib/socket';

const AUTH_TOKEN_KEY = 'userToken';
const USER_KEY = 'user';
const PRIVATE_KEY_KEY = 'pvk';
const PUBLIC_KEY_KEY = 'pbk';

export const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    privateKey: null,
    publicKey: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    /**
     * Initialize auth state from storage
     */
    initialize: async () => {
        try {
            const token = storage.get(AUTH_TOKEN_KEY);
            const user = storage.get(USER_KEY);
            const privateKey = secureStorage.get(PRIVATE_KEY_KEY);
            const publicKey = storage.get(PUBLIC_KEY_KEY);

            if (token && user && privateKey && publicKey) {
                // Connect socket and emit online status
                socketService.connect();

                set({
                    user,
                    token,
                    privateKey,
                    publicKey,
                    isAuthenticated: true,
                    isLoading: false
                });

                // Emit online status after state is set
                socketService.emitUserOnline(user);
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            get().logout();
            set({ isLoading: false });
        }
    },

    /**
     * Register a new user
     */
    register: async (username, password) => {
        try {
            set({ isLoading: true, error: null });

            // Step 1: Generate client-side auth hash (PBKDF2 with username as salt)
            const clientAuth = await pbkdf2(password, username.toLowerCase(), 25000, 512);

            // Step 2: Generate ECDH key pair
            const keyPair = await generateECDHKeyPair();

            // Step 3: Generate public key hash for identification
            const publicKeyHash = await sha256(keyPair.publicKey);

            // Step 4: Generate a client-side salt for private key encryption
            const keySalt = arrayBufferToBase64(getRandomBytes(16));

            // Step 5: Create passphrase and encrypt private key
            const passphrase = await pbkdf2(clientAuth + password, keySalt, 25000, 256);
            const privateKeyCipher = await encryptPrivateKey(keyPair.privateKey, passphrase, keySalt);

            // Step 6: Send registration request
            const response = await authApi.register({
                username: username.toLowerCase(),
                auth: clientAuth,
                publicKey: keyPair.publicKey,
                publicKeyHash,
                privateKeyCipher,
                keySalt
            });

            const { token, user } = response.data;

            // Store auth data
            storage.set(AUTH_TOKEN_KEY, token);
            storage.set(USER_KEY, user);
            storage.set(PUBLIC_KEY_KEY, keyPair.publicKey);
            secureStorage.set(PRIVATE_KEY_KEY, keyPair.privateKey);

            // Connect socket
            socketService.connect();
            socketService.emitUserOnline(user);

            set({
                user,
                token,
                privateKey: keyPair.privateKey,
                publicKey: keyPair.publicKey,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });

            return { success: true };
        } catch (error) {
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
        }
    },

    /**
     * Login existing user
     */
    login: async (username, password) => {
        try {
            set({ isLoading: true, error: null });

            // Step 1: Generate client-side auth hash
            const clientAuth = await pbkdf2(password, username.toLowerCase(), 25000, 512);

            // Step 2: Send login request
            const response = await authApi.login({
                username: username.toLowerCase(),
                auth: clientAuth
            });

            const { token, user } = response.data;

            // Step 3: Derive passphrase and decrypt private key using keySalt
            const passphrase = await pbkdf2(clientAuth + password, user.keySalt, 25000, 256);
            const privateKey = await decryptPrivateKey(user.privateKeyCipher, passphrase, user.keySalt);

            // Store auth data
            storage.set(AUTH_TOKEN_KEY, token);
            storage.set(USER_KEY, user);
            storage.set(PUBLIC_KEY_KEY, user.publicKey);
            secureStorage.set(PRIVATE_KEY_KEY, privateKey);

            // Connect socket
            socketService.connect();
            socketService.emitUserOnline(user);

            set({
                user,
                token,
                privateKey,
                publicKey: user.publicKey,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });

            return { success: true };
        } catch (error) {
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
        }
    },

    /**
     * Logout user
     */
    logout: () => {
        // Emit offline status before disconnecting
        socketService.emitUserOffline();
        socketService.disconnect();

        // Clear storage
        storage.remove(AUTH_TOKEN_KEY);
        storage.remove(USER_KEY);
        storage.remove(PUBLIC_KEY_KEY);
        secureStorage.remove(PRIVATE_KEY_KEY);

        set({
            user: null,
            token: null,
            privateKey: null,
            publicKey: null,
            isAuthenticated: false,
            error: null
        });
    },

    /**
     * Update user profile
     */
    updateUser: (updates) => {
        const { user } = get();
        if (user) {
            const updatedUser = { ...user, ...updates };
            storage.set(USER_KEY, updatedUser);
            set({ user: updatedUser });
        }
    },

    /**
     * Clear error
     */
    clearError: () => set({ error: null })
}));
