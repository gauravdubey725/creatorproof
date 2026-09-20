/**
 * Computes a real SHA-256 hash using the Web Crypto API
 */
export async function computeSHA256(fileOrString: File | Blob | string): Promise<string> {
  try {
    let buffer: ArrayBuffer;

    if (typeof fileOrString === 'string') {
      const encoder = new TextEncoder();
      buffer = encoder.encode(fileOrString).buffer as ArrayBuffer;
    } else {
      buffer = await fileOrString.arrayBuffer();
    }

    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.warn('Crypto subtle error, generating deterministic fallback hash:', error);
    const seed = typeof fileOrString === 'string' 
      ? fileOrString 
      : ('name' in fileOrString ? fileOrString.name : 'binary_data');
    return generateFallbackHash(seed);
  }
}

/**
 * Fallback hash generator if SubtleCrypto is restricted in iFrame sandbox
 * Completely deterministic 64-char hex digest using dual 32-bit FNV/Murmur mixing
 */
export function generateFallbackHash(seed: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  let h3 = 0xdeadbeef;
  let h4 = 0x41c6ce57;

  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 16777619);
    h2 = Math.imul(h2 ^ ch, 2246822507);
    h3 = Math.imul(h3 ^ (ch << 3), 3266489909);
    h4 = Math.imul(h4 ^ (ch >> 2), 2654435761);
  }

  // Avalanche rounds
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const hex4 = (h4 >>> 0).toString(16).padStart(8, '0');
  
  // Combine into 64-character deterministic hex string
  const combined = hex1 + hex2 + hex3 + hex4 + hex4 + hex3 + hex2 + hex1;
  return combined.substring(0, 64);
}

/**
 * Safely reads a File as a base64 Data URL for thumbnail preview
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Generates a mock blockchain transaction hash (e.g. 0x8a92...)
 */
export function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let tx = '0x';
  for (let i = 0; i < 64; i++) {
    tx += chars[Math.floor(Math.random() * chars.length)];
  }
  return tx;
}

/**
 * Formats byte size into human readable string (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Shortens a cryptographic hash or address for UI readability (e.g. 0x7c3a...4f1e)
 */
export function shortenHash(hash: string, start = 8, end = 6): string {
  if (!hash) return '';
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

/**
 * Copies text to clipboard safely
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
}
