# 🔐 CipherLink

<div align="center">

![CipherLink Logo](client/public/favicon.svg)

**End-to-End Encrypted Instant Messaging Application**

[![Security](https://img.shields.io/badge/Security-E2E%20Encrypted-green.svg)](https://github.com)
[![ECDH](https://img.shields.io/badge/Key%20Exchange-ECDH%20P--521-blue.svg)](https://github.com)
[![AES](https://img.shields.io/badge/Encryption-AES--256--GCM-purple.svg)](https://github.com)
[![PBKDF2](https://img.shields.io/badge/Hashing-PBKDF2%20SHA--512-orange.svg)](https://github.com)

</div>

---

## 📋 Overview

CipherLink is a secure, real-time messaging application built for the Information Security course. It implements industry-standard cryptographic protocols to ensure that only the intended recipients can read messages.

### 🔒 Security Features

| Feature                  | Implementation              | Description                                                       |
| ------------------------ | --------------------------- | ----------------------------------------------------------------- |
| **Key Exchange**         | ECDH (P-521)                | Elliptic Curve Diffie-Hellman using the secp521r1 curve (521-bit) |
| **Symmetric Encryption** | AES-256-GCM                 | Authenticated encryption with 256-bit keys                        |
| **Password Hashing**     | PBKDF2-SHA512               | 75,000 total iterations (25,000 client + 50,000 server)           |
| **Key Storage**          | AES-encrypted               | Private keys encrypted before storage                             |
| **Transport**            | WebSocket over TLS          | Real-time encrypted communication                                 |
| **API Security**         | Rate limiting, Helmet, CORS | Protection against common attacks                                 |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT (React)                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Auth UI   │  │  Chat UI    │  │  User UI    │  │  Inbox UI  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                │                │                │        │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐ │
│  │                     Zustand State Management                    │ │
│  └─────────────────────────────┬───────────────────────────────────┘ │
│                                │                                     │
│  ┌─────────────────────────────┴───────────────────────────────────┐ │
│  │                   Web Crypto API (crypto.js)                     │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │ │
│  │  │  ECDH    │  │ AES-GCM  │  │ PBKDF2   │  │   SHA-256/512    │ │ │
│  │  │  P-521   │  │  256-bit │  │ 25,000   │  │     Hashing      │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                │                                     │
│  ┌─────────────────────────────┴───────────────────────────────────┐ │
│  │              Socket.io Client + Axios HTTP Client               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTPS / WSS
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          SERVER (Node.js)                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Security Middleware                           │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │ │
│  │  │  Helmet  │  │  CORS    │  │   Rate   │  │       JWT        │ │ │
│  │  │  CSP     │  │  Origin  │  │  Limiter │  │   Verification   │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                │                                     │
│  ┌─────────────────────────────┴───────────────────────────────────┐ │
│  │                    Express.js + Socket.io                        │ │
│  └─────────────────────────────┬───────────────────────────────────┘ │
│                                │                                     │
│  ┌─────────────────────────────┴───────────────────────────────────┐ │
│  │                   PBKDF2 Server-Side Hashing                     │ │
│  │                   (50,000 additional iterations)                  │ │
│  └─────────────────────────────┬───────────────────────────────────┘ │
│                                │                                     │
│  ┌─────────────────────────────┴───────────────────────────────────┐ │
│  │                         MongoDB                                  │ │
│  │  ┌──────────────────┐  ┌──────────────────────────────────────┐ │ │
│  │  │   Users Model    │  │            Chats Model                │ │ │
│  │  │  - username      │  │  - encrypted senderName               │ │ │
│  │  │  - hashed auth   │  │  - encrypted message                  │ │ │
│  │  │  - encrypted pvk │  │  - encrypted timestamp                │ │ │
│  │  │  - public key    │  │  - channel ID                         │ │ │
│  │  └──────────────────┘  └──────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Cryptographic Flow

### Registration Process

```
1. User enters: username, password
                    │
                    ▼
2. Client computes: auth = PBKDF2(password, username, 25000, SHA-512)
                    │
                    ▼
3. Client generates: ECDH key pair (P-521 curve)
                    │
                    ▼
4. Client computes: publicKeyHash = SHA-256(publicKey)
                    │
                    ▼
5. Send to server: { username, auth, publicKey, publicKeyHash }
                    │
                    ▼
6. Server generates: salt = random(12 bytes)
                    │
                    ▼
7. Server computes: serverAuth = PBKDF2(auth, salt, 50000, SHA-512)
                    │
                    ▼
8. Client derives: passphrase = PBKDF2(auth + password, salt, 25000)
                    │
                    ▼
9. Client encrypts: privateKeyCipher = AES-GCM(privateKey, passphrase)
                    │
                    ▼
10. Store in DB: { username, serverAuth, salt, privateKeyCipher, publicKey }
```

### Message Encryption (Private Chat)

```
1. Sender has: (senderPrivateKey, receiverPublicKey)
                    │
                    ▼
2. Derive shared secret: sharedKey = ECDH(senderPrivateKey, receiverPublicKey)
                    │
                    ▼
3. Generate IV: iv = random(12 bytes)
                    │
                    ▼
4. Encrypt message: ciphertext = AES-256-GCM(plaintext, sharedKey, iv)
                    │
                    ▼
5. Transmit: { iv || ciphertext } (Base64 encoded)
```

### Message Decryption

```
1. Receiver has: (receiverPrivateKey, senderPublicKey)
                    │
                    ▼
2. Derive SAME shared secret: sharedKey = ECDH(receiverPrivateKey, senderPublicKey)
   (ECDH guarantees: senderPvk × receiverPbk = receiverPvk × senderPbk)
                    │
                    ▼
3. Extract: iv = ciphertext[0:12], encrypted = ciphertext[12:]
                    │
                    ▼
4. Decrypt: plaintext = AES-256-GCM-decrypt(encrypted, sharedKey, iv)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **MongoDB** >= 6.0
- **npm** or **yarn**

### Installation

1. **Clone the repository**

   ```bash
   cd "d:\university\Semester 7\Information Security\Semester-Project\cipherLink"
   ```

2. **Install server dependencies**

   ```bash
   npm install
   ```

3. **Install client dependencies**

   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Configure environment**

   ```bash
   # Copy example env file
   copy .env.example .env

   # Edit .env with your settings
   # - Set MONGODB_URI
   # - Set JWT_SECRET (use a strong random string)
   ```

5. **Start MongoDB**

   ```bash
   # Make sure MongoDB is running locally
   # Default connection: mongodb://localhost:27017/cipherlink
   ```

6. **Start the development servers**

   Terminal 1 (Backend):

   ```bash
   npm run dev
   ```

   Terminal 2 (Frontend):

   ```bash
   cd client
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4200

---

## 📁 Project Structure

```
cipherLink/
├── src/                          # Backend source
│   ├── index.js                  # Express server entry
│   ├── models/                   # MongoDB models
│   │   ├── User.model.js        # User schema
│   │   └── Chat.model.js        # Chat schema
│   ├── routes/                   # API routes
│   │   ├── auth.routes.js       # Authentication
│   │   ├── user.routes.js       # User management
│   │   └── chat.routes.js       # Chat operations
│   ├── middleware/               # Express middleware
│   │   └── auth.middleware.js   # JWT verification
│   └── socket/                   # Socket.io handlers
│       └── index.js             # Real-time events
│
├── client/                       # Frontend source
│   ├── src/
│   │   ├── lib/                 # Utilities
│   │   │   ├── crypto.js        # 🔐 Cryptography (ECDH, AES, PBKDF2)
│   │   │   ├── api.js           # HTTP client
│   │   │   ├── socket.js        # Socket.io client
│   │   │   └── utils.js         # Helper functions
│   │   ├── stores/              # Zustand state
│   │   │   ├── authStore.js     # Auth state
│   │   │   ├── chatStore.js     # Chat state
│   │   │   └── toastStore.js    # Notifications
│   │   ├── components/          # React components
│   │   │   ├── ui/              # Reusable UI
│   │   │   ├── auth/            # Auth components
│   │   │   └── chat/            # Chat components
│   │   └── pages/               # Page components
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       └── ChatPage.jsx
│   └── ...
│
├── .env.example                  # Environment template
├── package.json                  # Backend dependencies
└── README.md                     # This file
```

---

## 🛡️ Security Considerations

### What's Protected

- ✅ **Private messages** - Encrypted with AES-256-GCM using ECDH shared secret
- ✅ **Passwords** - Never stored in plain text (PBKDF2 with 75,000 iterations)
- ✅ **Private keys** - Encrypted with user's passphrase before storage
- ✅ **Transport** - All communication over WebSocket/HTTPS
- ✅ **API** - Rate limited, CORS protected, secure headers via Helmet

### Threat Model

| Threat                | Mitigation                                  |
| --------------------- | ------------------------------------------- |
| **Eavesdropping**     | End-to-end encryption (ECDH + AES-GCM)      |
| **MITM attacks**      | Public key fingerprint verification         |
| **Password cracking** | PBKDF2 with 75,000 iterations               |
| **Replay attacks**    | Unique IV for each message, timestamps      |
| **XSS**               | Content Security Policy, input sanitization |
| **CSRF**              | JWT token-based authentication              |
| **Brute force**       | Rate limiting on auth endpoints             |

### Limitations

- ⚠️ **Global chat** is NOT encrypted (by design - public room)
- ⚠️ **Metadata** (who talks to whom, when) is visible to server
- ⚠️ **Forward secrecy** not implemented (same key pair for all messages)
- ⚠️ **No key rotation** mechanism

---

## 🧪 Testing the Encryption

1. **Create two accounts** in different browsers/incognito windows
2. **Start a private chat** between them
3. **Check MongoDB** - messages are stored encrypted:
   ```javascript
   {
     senderName: "U2FsdGVkX1...",    // Encrypted
     message: "U2FsdGVkX1...",       // Encrypted
     timestamp: "U2FsdGVkX1...",     // Encrypted
     messageType: "encrypted"
   }
   ```
4. **Verify fingerprints** - Both users see the same fingerprint for the other party

---

## 📚 Technologies Used

### Backend

- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication tokens
- **Helmet** - Security headers
- **bcrypt** - Salt generation
- **Node.js Crypto** - PBKDF2 (server-side)

### Frontend

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **Web Crypto API** - Client-side cryptography
- **Socket.io Client** - Real-time client

---

## 📝 License

This project is created for educational purposes as part of the Information Security course.

---

## 👥 Contributors

- CipherLink Team - Information Security Semester Project

---

<div align="center">

**🔐 Secure • Private • Encrypted**

_Your messages, your keys, your privacy._

</div>
