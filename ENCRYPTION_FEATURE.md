# Encryption & Security Features

## Overview

The Finance Dashboard now includes comprehensive encryption features to securely protect sensitive financial information like wallet addresses and card numbers. All encryption is performed client-side using the Web Crypto API, ensuring maximum security and privacy.

## Key Features

### 1. **Master Passcode Authentication**
- **Purpose**: Secure access to the entire dApp
- **Default Passcode**: `888888`
- **When Used**: Required on every app load to unlock the dashboard
- **Security**: Session-based verification (cached in sessionStorage for the current session)

### 2. **Per-Item Encryption**
Each wallet/card can be individually encrypted with its own 6-digit numeric passcode:
- Encrypt wallet addresses (Web3 mode)
- Encrypt card numbers (Web2 mode)
- Each item maintains its own encryption key derived from the passcode

### 3. **Encryption Details**

#### Encryption Algorithm
- **Method**: AES-GCM (Advanced Encryption Standard - Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Key Size**: 256-bit (AES-256)
- **IV (Initialization Vector)**: Randomly generated 12 bytes per encryption
- **Salt**: Randomly generated 16 bytes per encryption

#### Security Features
- Unique salt for each encryption operation
- Unique IV for each encryption operation
- PBKDF2 with 100,000 iterations prevents brute-force attacks
- Client-side only - data never sent to server unencrypted

## How to Use

### Encrypting a Card/Wallet

1. Navigate to the Cards page
2. Click "Add Wallet" or "Add Card" button
3. Fill in the required information
4. Click "Encrypt" button
5. Two popups will appear in sequence:
   - **First Popup**: Enter and confirm a 6-digit passcode
   - Data is encrypted with this passcode
6. The card/wallet is now stored with encrypted sensitive data
7. The display shows masked data (first 4 and last 4 characters)

**Example**:
- Original wallet address: `0x71C7656EC7ab88b098defB751B7401B5f6d8976F`
- Displayed as: `71C7****76F` (masked)

### Decrypting Data

1. On a wallet/card card with encrypted data, click the **Eye Icon** (👁️)
2. A decryption popup appears
3. Enter your 6-digit passcode
4. Click "Decrypt"
5. If passcode is correct, the data is revealed temporarily
6. Click the Eye Icon again to hide it

### Master Passcode

- **How to Access**: Required on app load
- **Default**: `888888`
- **To Change**: You can modify the `MASTER_PASSCODE` constant in [app/cards/page.tsx](app/cards/page.tsx) at line 116
- **Session Duration**: Valid for the current browser session

## Technical Implementation

### Files Modified/Created

1. **[app/utils/encryption.ts](app/utils/encryption.ts)** - New file
   - `encryptData()` - Encrypt data with passcode
   - `decryptData()` - Decrypt data with passcode
   - `hashPasscode()` - Hash passcode for verification
   - `verifyPasscode()` - Verify passcode against hash
   - `maskData()` - Create masked display version

2. **[app/cards/page.tsx](app/cards/page.tsx)** - Updated with:
   - Master passcode verification modal
   - Encryption modal for new items
   - Decryption modal for viewing encrypted data
   - Updated state management for encryption
   - Updated CryptoWallet and BankCard interfaces

### Data Structure

#### Encrypted Item Storage
```typescript
interface EncryptedData {
  [cardId/walletId]: {
    address?: string;      // Encrypted address (wallets)
    number?: string;        // Encrypted number (cards)
    iv: string;             // Base64-encoded IV
    salt: string;           // Base64-encoded salt
  },
  passcode?: string;       // Hashed passcode for verification
}
```

## Security Considerations

### What's Protected
✅ Wallet addresses (encrypted at rest)
✅ Card numbers (encrypted at rest)
✅ Passcodes (never stored in plaintext, only hashes)
✅ Each item has unique encryption key

### What's NOT Protected
⚠️ Card name, bank name, wallet name (not encrypted)
⚠️ Balance information (not encrypted)
⚠️ Metadata like date created (not encrypted)

### Best Practices

1. **Use Strong Passcodes**
   - Use different passcodes for different items
   - Avoid simple sequences like 111111 or 123456
   - Use random numbers: 847392, 562189, etc.

2. **Master Passcode**
   - Change from default `888888` immediately in production
   - Store securely, do not share
   - This is NOT the item encryption password

3. **Session Management**
   - Master passcode is cached per session
   - Close browser when done to clear session
   - Each new browser session requires re-authentication

4. **Device Security**
   - Always use encryption on shared devices
   - Enable device lock when away
   - Clear browser cache periodically

## UI Components

### Master Passcode Modal
- Appears on app load
- Blue shield icon
- 6-digit numeric input
- Shake animation on wrong passcode
- Error messages for validation

### Encryption Modal
- Lock icon (🔒) in title
- Two input fields: Passcode + Confirm
- Detailed instructions
- Error handling for mismatches
- Loading state during encryption

### Decryption Modal
- Eye icon (👁️) in title
- Single input field for passcode
- Real-time error messages
- Auto-focus on input
- Loading state during decryption

## Display States

### Encrypted Data States

**Locked (Encrypted, Not Decrypted)**
```
Address: 71C7****76F [👁️ Eye Icon]
```
- Clicking eye icon trigger decryption

**Unlocked (Decrypted)**
```
Address: 71C7656EC7ab88b098defB751B7401B5f6d8976F [👁️ EyeOff Icon]
```
- Clicking eye icon hides it again
- Auto-hides when leaving page

## API Reference

### encryptData(data, passcode)
```typescript
async function encryptData(
  data: string,
  passcode: string
): Promise<{ encryptedData: string; iv: string; salt: string }>
```
Encrypts a string with the provided passcode.

### decryptData(encryptedData, passcode, salt, iv)
```typescript
async function decryptData(
  encryptedData: string,
  passcode: string,
  salt: string,
  iv: string
): Promise<string>
```
Decrypts data if passcode is correct, throws error otherwise.

### maskData(data)
```typescript
function maskData(data: string): string
```
Returns masked version: `XXXX...XXXX` format

## Troubleshooting

### "Failed to decrypt - incorrect passcode"
- The passcode you entered doesn't match
- Passcodes are case-sensitive (but numeric only)
- Ensure you're using the correct item's passcode

### "Passcode must contain only numbers"
- Encryption passcodes must be 6 digits (0-9)
- Non-numeric characters are not allowed

### "Passcodes do not match"
- The two passcode inputs don't match
- Re-enter both carefully

### Master passcode shows "Incorrect passcode"
- Check you're using the correct master passcode
- Default is `888888` (change if you've customized)

## Browser Compatibility

Requires browsers with Web Crypto API support:
- Chrome/Edge 37+
- Firefox 34+
- Safari 11+
- Not supported: Internet Explorer

## Future Enhancements

Potential improvements for future versions:
- [ ] Biometric authentication (fingerprint/face)
- [ ] Master passcode recovery
- [ ] Encrypted backup & export
- [ ] Multiple master passphrases for shared accounts
- [ ] Automatic session timeout
- [ ] Activity logging
- [ ] Server-side backup encryption
