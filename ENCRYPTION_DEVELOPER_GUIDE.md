# Encryption Feature - Developer Guide

## Architecture Overview

```
┌─────────────────────┐
│   Master Passcode   │
│     Verification    │ (sessionStorage cached)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Cards/Wallets     │
│   Management Page   │
└──────────┬──────────┘
       ┌───┴───┐
       ▼       ▼
    Add    View/Decrypt
     │         │
     ▼         ▼
  ┌────────────────────┐
  │ Encryption Modals  │ ◄─── Web Crypto API
  │ - Encrypt Modal    │      (client-side only)
  │ - Decrypt Modal    │
  └────────────────────┘
           │
           ▼
  ┌────────────────────┐
  │ encryption.ts      │ (PBKDF2 + AES-GCM)
  │ Utility Functions  │
  └────────────────────┘
```

## Code Organization

### File: `app/utils/encryption.ts`

**Purpose**: Core cryptographic functions using Web Crypto API

**Key Functions**:

1. `deriveKeyFromPasscode(passcode, salt)`
   - Uses PBKDF2 to derive encryption key from passcode
   - 100,000 iterations for security
   - Returns CryptoKey object

2. `encryptData(data, passcode)`
   - Generates random salt and IV
   - Derives encryption key
   - Encrypts using AES-GCM
   - Returns object with base64-encoded values

3. `decryptData(encryptedData, passcode, salt, iv)`
   - Reconstructs encryption key from passcode + salt
   - Decrypts using AES-GCM
   - Throws error if passcode is wrong
   - Returns plaintext string

4. `hashPasscode(passcode)`
   - SHA-256 hash for verification
   - Used to store passcode reference

5. `maskData(data)`
   - Simple display utility
   - Shows first 4 + last 4 characters
   - Replaces middle with asterisks

### File: `app/cards/page.tsx`

**Master Passcode Section** (Lines ~111-127)
```typescript
const [appPasscodeVerified, setAppPasscodeVerified] = useState(false);
const MASTER_PASSCODE = "888888";  // Change this!

// Verification check on mount
useEffect(() => {
  const verified = sessionStorage.getItem("appPasscodeVerified");
  if (verified === "true") {
    setAppPasscodeVerified(true);
  }
}, []);
```

**Master Passcode Modal** (Lines ~423-554)
- Shows when `!appPasscodeVerified`
- Handles input validation
- Sets `sessionStorage.appPasscodeVerified`

**Encryption Modal** (Lines ~1295-1455)
- Shows when `showEncryptModal` is true
- Takes passcode input (must match)
- Validates 6-digit numeric requirement
- Calls `encryptData()` on confirm

**Decryption Modal** (Lines ~1457-1605)
- Shows when `showDecryptModal` is true
- Takes single passcode input
- Calls `decryptData()` to reveal data
- Stores result in `decryptedData` state

**Updated Interfaces** (Lines ~51-81)
```typescript
interface CryptoWallet {
  // ... existing fields
  isEncrypted?: boolean;
  encryptedData?: {
    address: string;  // Base64-encoded encrypted address
    iv: string;       // Base64-encoded IV
    salt: string;     // Base64-encoded salt
  };
  passcode?: string;  // SHA-256 hash (for verification only)
}
```

## State Management

### Encryption States
```typescript
// Encryption modal state
const [showEncryptModal, setShowEncryptModal] = useState(false);
const [encryptionPasscode, setEncryptionPasscode] = useState("");
const [encryptionPasscodeConfirm, setEncryptionPasscodeConfirm] = useState("");
const [encryptionError, setEncryptionError] = useState("");
const [encryptionLoading, setEncryptionLoading] = useState(false);

// Decryption modal state
const [showDecryptModal, setShowDecryptModal] = useState(false);
const [decryptPasscode, setDecryptPasscode] = useState("");
const [decryptError, setDecryptError] = useState("");
const [decryptItemId, setDecryptItemId] = useState<string | null>(null);
const [decryptedData, setDecryptedData] = useState<{ [key: string]: string }>({});
const [decryptLoading, setDecryptLoading] = useState(false);
```

### Handlers

**handleEncryptionConfirm()**
- Validates passcodes match
- Validates 6-digit numeric
- Calls `hashPasscode()` for storage
- Calls `encryptData()` with passcode
- Creates new item with encrypted data
- Clears form and modals

**handleDecryptStart(itemId)**
- Sets up decryption modal
- Stores item ID for later use

**handleDecryptConfirm()**
- Validates passcode format
- Calls `decryptData()` with stored encryption params
- On success: stores in `decryptedData[itemId]`
- On failure: shows error message

**handleMasterPasscodeVerify()**
- Compares input to `MASTER_PASSCODE`
- Sets `appPasscodeVerified` state
- Writes to `sessionStorage`

## Security Implementation Details

### Key Derivation (PBKDF2)
```javascript
// From encryptData()
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.deriveKey(
  {
    name: "PBKDF2",
    salt: salt as BufferSource,
    iterations: 100000,  // High iteration count
    hash: "SHA-256",
  },
  passphraseKey,
  { name: "AES-GCM", length: 256 },  // 256-bit key
  false,
  ["encrypt", "decrypt"]
);
```

### Encryption (AES-GCM)
```javascript
const iv = crypto.getRandomValues(new Uint8Array(12));
const encryptedBuffer = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv: iv },
  key,
  encoder.encode(data)
);
```

### Base64 Encoding
All binary data is converted to Base64 for storage:
```javascript
const encryptedData = btoa(
  String.fromCharCode(...new Uint8Array(encryptedBuffer))
);
```

## Testing the Feature

### Manual Testing Flow

1. **Test Master Passcode**
   - Load app, should see passcode modal
   - Enter "888888", should unlock
   - Refresh page, should ask again (new session)

2. **Test Encryption**
   - Go to Cards page
   - Click "Add Card"
   - Fill in details, click "Encrypt"
   - First modal: Enter passcode "123456" twice
   - Should add card with masked number

3. **Test Decryption**
   - Encrypted card shows masked address
   - Click eye icon
   - Second modal: Enter "123456"
   - Should reveal full address
   - Click eye again to hide

4. **Test Error Cases**
   - Wrong passcode on decrypt: Should show error
   - Mismatched passcodes on encrypt: Should show error
   - Non-numeric input: Should be filtered
   - Too short passcode: Button disabled

### Unit Testing Example
```typescript
// Test encryption/decryption
const encrypted = await encryptData("0x123456", "999999");
const decrypted = await decryptData(
  encrypted.encryptedData,
  "999999",
  encrypted.salt,
  encrypted.iv
);
expect(decrypted).toBe("0x123456");

// Test wrong passcode
expect(
  decryptData(encrypted.encryptedData, "111111", ...)
).rejects.toThrow();
```

## Customization Guide

### Change Master Passcode
**Location**: `app/cards/page.tsx`, line ~116
```typescript
const MASTER_PASSCODE = "123456";  // Change here
```

### Adjust Encryption Parameters
**Location**: `app/utils/encryption.ts`

- **Iteration count** (line ~20): Change `iterations: 100000`
  - Higher = more secure but slower
  - Minimum recommended: 100,000

- **IV size** (line ~45): `new Uint8Array(12)`
  - 12 bytes (96 bits) is standard for GCM
  - Don't change unless you know why

- **Salt size** (line ~44): `new Uint8Array(16)`
  - 16 bytes (128 bits) is standard
  - Can increase for extra security

### Add Encryption to Other Fields
Example: Encrypt bank name
```typescript
// In handleAddCard:
const encryptedBank = await encryptData(formData.bank, encryptionPasscode);
newCard.encryptedData.bank = encryptedBank.encryptedData;

// In display:
{card.isEncrypted ? maskData(card.bank) : card.bank}

// In decrypt handler:
const bank = await decryptData(
  encryptedData.bank,
  decryptPasscode,
  encryptedData.salt,
  encryptedData.iv
);
```

## Common Issues & Solutions

### Issue: "Type 'Uint8Array<ArrayBufferLike>' not assignable"
**Solution**: Cast to `BufferSource`
```typescript
salt: salt as BufferSource,
```

### Issue: Decrypted data doesn't persist after page refresh
**This is intentional** - Decrypted data is cleared on:
- Page navigation
- Browser refresh
- Component unmount
- User clicks eye icon to hide

To persist, implement localStorage or secure backend storage.

### Issue: Master passcode works on first load but fails after
**Check**: sessionStorage is cleared
- Close DevTools
- Check if Private/Incognito window
- Browser might be clearing sessionStorage

## Performance Considerations

- **Encryption/Decryption**: ~100-200ms (per operation)
- **Master passcode verification**: <10ms (string comparison)
- **PBKDF2 key derivation**: ~50-100ms (intentionally slow for security)

## Security Auditing

### What Should Be Audited
- [ ] All encryption/decryption operations
- [ ] Passcode validation logic
- [ ] Session management
- [ ] Data clearing on logout
- [ ] No plaintext storage
- [ ] No sensitive data in logs

### Security Headers Needed
```
Content-Security-Policy: script-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

## Future Improvements

1. **Biometric Authentication**
   ```typescript
   const credential = await navigator.credentials.get({ 
     publicKey: {...} 
   });
   ```

2. **Secure Key Storage**
   - IndexedDB with Transparent Encryption
   - Service Worker encryption layer

3. **Encrypted Export**
   - Generate encrypted backup files
   - QR code for sharing encrypted data

4. **Multi-Device Sync**
   - Cloud sync with end-to-end encryption
   - Master key management

5. **Activity Logging**
   - Encrypted audit trail
   - Track decrypt attempts
