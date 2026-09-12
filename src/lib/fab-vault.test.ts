import { describe, it, expect } from 'vitest';
import {
  exportEncryptedSemiProj,
  importEncryptedSemiProj,
  exportPlainSemiProj,
  importPlainSemiProj,
  bufferToHex,
  hexToBuffer,
  calculateSha256,
} from './fab-vault';

describe('Cleanroom Air-Gapped Vault (.semiproj)', () => {
  it('converts between ArrayBuffer and hex string accurately', () => {
    const original = new Uint8Array([0, 15, 255, 128, 42]);
    const hex = bufferToHex(original);
    expect(hex).toBe('000fff802a');

    const recovered = hexToBuffer(hex);
    expect(Array.from(recovered)).toEqual(Array.from(original));
  });

  it('calculates SHA-256 hash correctly', async () => {
    const hash = await calculateSha256('SemiTools cleanroom test payload');
    expect(hash.length).toBe(64); // 256 bits = 64 hex chars
  });

  it('encrypts and decrypts .semiproj project bundle with AES-GCM-256 and PBKDF2', async () => {
    const testProject = {
      name: '7nm HKMG Gate Stack',
      filmStack: [
        { material: 'HfO2', thicknessNm: 2.1 },
        { material: 'TiN', thicknessNm: 5.0 },
        { material: 'W', thicknessNm: 45.0 },
      ],
      recipes: {
        aldTempC: 300,
        annealTimeSec: 10,
      },
    };

    const passphrase = 'FabSecretKey#2025';
    const encryptedJson = await exportEncryptedSemiProj(testProject, passphrase, {
      projectName: 'HKMG Development',
      creator: 'Lead Integration Engineer',
      facility: 'Fab 12A Cleanroom',
    });

    expect(encryptedJson).toContain('SEMIPROJ_VAULT');
    expect(encryptedJson).toContain('AES-GCM-256');
    expect(encryptedJson).not.toContain('HfO2'); // Plaintext must not be exposed

    // Decrypt with correct passphrase
    const decrypted = await importEncryptedSemiProj<typeof testProject>(encryptedJson, passphrase);
    expect(decrypted.data).toEqual(testProject);
    expect(decrypted.metadata.projectName).toBe('HKMG Development');
    expect(decrypted.metadata.facility).toBe('Fab 12A Cleanroom');

    // Attempt decrypt with wrong passphrase
    await expect(
      importEncryptedSemiProj(encryptedJson, 'WrongPassphrase!')
    ).rejects.toThrow(/Decryption failed/);
  });

  it('exports and imports plaintext .semiproj bundle with anti-tamper checksum', async () => {
    const sampleData = { lotId: 'LOT-9982', yield: 0.984 };
    const plainBundleJson = await exportPlainSemiProj(sampleData, {
      projectName: 'Yield Lot Report',
    });

    expect(plainBundleJson).toContain('SEMIPROJ_PLAIN');
    expect(plainBundleJson).toContain('checksumSha256');

    // Valid import
    const res = await importPlainSemiProj<typeof sampleData>(plainBundleJson);
    expect(res.data).toEqual(sampleData);
    expect(res.isChecksumValid).toBe(true);

    // Tampered payload
    const tampered = JSON.parse(plainBundleJson);
    tampered.payload.yield = 0.5; // altered
    const tamperedJson = JSON.stringify(tampered);

    const tamperedRes = await importPlainSemiProj<typeof sampleData>(tamperedJson);
    expect(tamperedRes.isChecksumValid).toBe(false); // Tamper detected!
  });
});
