/**
 * Cleanroom Air-Gapped Vault & Encrypted .semiproj Archive Packages
 *
 * Implements client-side zero-knowledge security for fab recipes, film stacks,
 * wafer defect maps, and metrology runs:
 * - Web Crypto API (AES-GCM-256)
 * - PBKDF2 key derivation (SHA-256, 100,000 iterations, random salt)
 * - Anti-tamper SHA-256 payload checksums
 * - Portable JSON / Base64 bundle serialization for air-gapped USB/network transfer
 */

export interface VaultMetadata {
  projectName: string;
  creator?: string;
  facility?: string;
  description?: string;
  createdAt: string;
  itemTypes?: string[];
}

export interface EncryptedSemiProjEnvelope {
  magic: 'SEMIPROJ_VAULT';
  version: 1;
  cipher: 'AES-GCM-256';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  saltHex: string;
  ivHex: string;
  metadata: VaultMetadata;
  ciphertextHex: string; // contains ciphertext + auth tag
}

export interface PlainSemiProjEnvelope<T = unknown> {
  magic: 'SEMIPROJ_PLAIN';
  version: 1;
  metadata: VaultMetadata;
  checksumSha256: string;
  payload: T;
}

// Utility: ArrayBuffer <-> Hex
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Calculates SHA-256 hash of a string
 */
export async function calculateSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Derives an AES-GCM-256 key from a passphrase and salt using PBKDF2
 */
async function deriveKey(passphrase: string, salt: Uint8Array, iterations = 100000): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Exports data into an AES-GCM encrypted .semiproj JSON envelope
 */
export async function exportEncryptedSemiProj(
  data: unknown,
  passphrase: string,
  metadata?: Partial<VaultMetadata>
): Promise<string> {
  if (!passphrase || passphrase.length < 4) {
    throw new Error('Vault passphrase must be at least 4 characters long.');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  const key = await deriveKey(passphrase, salt, iterations);

  const jsonPayload = JSON.stringify(data);
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(jsonPayload);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plaintext
  );

  const fullMetadata: VaultMetadata = {
    projectName: metadata?.projectName || 'Cleanroom Project',
    creator: metadata?.creator || 'Process Engineer',
    facility: metadata?.facility || 'Fab Vault',
    description: metadata?.description || '',
    createdAt: new Date().toISOString(),
    itemTypes: metadata?.itemTypes || [],
  };

  const envelope: EncryptedSemiProjEnvelope = {
    magic: 'SEMIPROJ_VAULT',
    version: 1,
    cipher: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256',
    iterations,
    saltHex: bufferToHex(salt),
    ivHex: bufferToHex(iv),
    metadata: fullMetadata,
    ciphertextHex: bufferToHex(encryptedBuffer),
  };

  return JSON.stringify(envelope, null, 2);
}

/**
 * Imports and decrypts a .semiproj JSON envelope using the passphrase
 */
export async function importEncryptedSemiProj<T = unknown>(
  packageJson: string,
  passphrase: string
): Promise<{ data: T; metadata: VaultMetadata }> {
  let envelope: EncryptedSemiProjEnvelope;
  try {
    envelope = JSON.parse(packageJson);
  } catch {
    throw new Error('Invalid project file: Could not parse JSON envelope.');
  }

  if (envelope.magic !== 'SEMIPROJ_VAULT' || envelope.cipher !== 'AES-GCM-256') {
    throw new Error('Unsupported archive format: not an encrypted .semiproj file.');
  }

  const salt = hexToBuffer(envelope.saltHex);
  const iv = hexToBuffer(envelope.ivHex);
  const ciphertext = hexToBuffer(envelope.ciphertextHex);

  const key = await deriveKey(passphrase, salt, envelope.iterations || 100000);

  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as ArrayBuffer,
      },
      key,
      ciphertext as unknown as ArrayBuffer
    );
  } catch {
    throw new Error('Decryption failed: incorrect passphrase or corrupted archive package.');
  }

  const decoder = new TextDecoder();
  const jsonStr = decoder.decode(decryptedBuffer);
  const data = JSON.parse(jsonStr) as T;

  return {
    data,
    metadata: envelope.metadata,
  };
}

/**
 * Exports unencrypted plaintext .semiproj bundle with SHA-256 tamper-evident checksum
 */
export async function exportPlainSemiProj<T = unknown>(
  data: T,
  metadata?: Partial<VaultMetadata>
): Promise<string> {
  const jsonPayload = JSON.stringify(data);
  const checksumSha256 = await calculateSha256(jsonPayload);

  const fullMetadata: VaultMetadata = {
    projectName: metadata?.projectName || 'Cleanroom Project',
    creator: metadata?.creator || 'Process Engineer',
    facility: metadata?.facility || 'Fab Vault',
    description: metadata?.description || '',
    createdAt: new Date().toISOString(),
    itemTypes: metadata?.itemTypes || [],
  };

  const envelope: PlainSemiProjEnvelope<T> = {
    magic: 'SEMIPROJ_PLAIN',
    version: 1,
    metadata: fullMetadata,
    checksumSha256,
    payload: data,
  };

  return JSON.stringify(envelope, null, 2);
}

/**
 * Imports unencrypted plaintext .semiproj bundle and validates checksum
 */
export async function importPlainSemiProj<T = unknown>(
  packageJson: string
): Promise<{ data: T; metadata: VaultMetadata; isChecksumValid: boolean }> {
  let envelope: PlainSemiProjEnvelope<T>;
  try {
    envelope = JSON.parse(packageJson);
  } catch {
    throw new Error('Invalid project file: Could not parse JSON envelope.');
  }

  if (envelope.magic !== 'SEMIPROJ_PLAIN') {
    throw new Error('Unsupported archive format: not a plain .semiproj file.');
  }

  const jsonPayload = JSON.stringify(envelope.payload);
  const actualChecksum = await calculateSha256(jsonPayload);
  const isChecksumValid = actualChecksum === envelope.checksumSha256;

  return {
    data: envelope.payload,
    metadata: envelope.metadata,
    isChecksumValid,
  };
}
