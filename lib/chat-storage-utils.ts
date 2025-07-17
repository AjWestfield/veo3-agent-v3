// Chat session storage utilities with compression and cleanup
import type { Message } from '@/app/page'

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  timestamp: Date
  lastUpdated: Date
}

// Compress a string using native CompressionStream API (if available)
export async function compressString(str: string): Promise<string> {
  if (typeof CompressionStream === 'undefined') {
    // Fallback for browsers that don't support CompressionStream
    return str;
  }
  
  try {
    const stream = new Response(str).body;
    if (!stream) return str;
    
    const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
    const compressedResponse = new Response(compressedStream);
    const compressedBlob = await compressedResponse.blob();
    const buffer = await compressedBlob.arrayBuffer();
    
    // Convert to base64 for storage
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64;
  } catch (error) {
    console.error('Compression failed:', error);
    return str;
  }
}

// Decompress a string
export async function decompressString(compressedStr: string): Promise<string> {
  if (typeof DecompressionStream === 'undefined') {
    // Fallback for browsers that don't support DecompressionStream
    return compressedStr;
  }
  
  try {
    // Convert from base64 back to binary
    const binaryString = atob(compressedStr);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const stream = new Response(bytes).body;
    if (!stream) return compressedStr;
    
    const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
    const decompressedResponse = new Response(decompressedStream);
    return await decompressedResponse.text();
  } catch (error) {
    console.error('Decompression failed:', error);
    return compressedStr;
  }
}

// Clean message content to reduce storage size
export function cleanMessageForStorage(message: Message): Message {
  const cleaned = { ...message };
  
  // Remove base64 image data from content
  if (cleaned.content && typeof cleaned.content === 'string') {
    // Replace base64 images with placeholders
    cleaned.content = cleaned.content.replace(
      /data:image\/[^;]+;base64,[^"'\s]+/g,
      '[IMAGE_REMOVED_FOR_STORAGE]'
    );
    
    // Replace base64 videos with placeholders
    cleaned.content = cleaned.content.replace(
      /data:video\/[^;]+;base64,[^"'\s]+/g,
      '[VIDEO_REMOVED_FOR_STORAGE]'
    );
    
    // Replace base64 audio with placeholders
    cleaned.content = cleaned.content.replace(
      /data:audio\/[^;]+;base64,[^"'\s]+/g,
      '[AUDIO_REMOVED_FOR_STORAGE]'
    );
  }
  
  // Clean files array - keep metadata and fileId for restoration
  if (cleaned.files && cleaned.files.length > 0) {
    cleaned.files = cleaned.files.map((file: any) => ({
      fileName: file.fileName || file.file?.name || file.name,
      type: file.type,
      fileSize: file.fileSize || file.file?.size || file.size,
      fileId: file.fileId, // Preserve fileId for IndexedDB restoration
      // Remove actual data to save space
      file: undefined as any, // Will be restored from IndexedDB
      preview: '[PREVIEW_REMOVED_FOR_STORAGE]',
      base64Data: undefined
    }));
  }
  
  return cleaned;
}

// Clean session for storage
export function cleanSessionForStorage(session: ChatSession): ChatSession {
  return {
    ...session,
    messages: session.messages.map(cleanMessageForStorage)
  };
}

// Get storage size estimate
export function getStorageSize(data: any): number {
  const str = JSON.stringify(data);
  return new Blob([str]).size;
}

// Get localStorage usage
export function getLocalStorageUsage(): { used: number; available: number; percentage: number } {
  let totalSize = 0;
  
  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    
    // Estimate available space (most browsers have 5-10MB limit)
    const estimatedMax = 5 * 1024 * 1024; // 5MB
    const available = estimatedMax - totalSize;
    const percentage = (totalSize / estimatedMax) * 100;
    
    return {
      used: totalSize,
      available: Math.max(0, available),
      percentage: Math.min(100, percentage)
    };
  } catch (error) {
    console.error('Failed to calculate storage usage:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
}

// Automatically clean up old sessions to free space
export function autoCleanupSessions(sessions: ChatSession[], targetSizeMB: number = 3): ChatSession[] {
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
  
  let currentSize = getStorageSize(sortedSessions) / (1024 * 1024);
  let kept = [...sortedSessions];
  
  // Remove old sessions until we're under the target size
  while (currentSize > targetSizeMB && kept.length > 1) {
    kept.pop(); // Remove the oldest session
    currentSize = getStorageSize(kept) / (1024 * 1024);
  }
  
  const removed = sortedSessions.length - kept.length;
  if (removed > 0) {
    console.log(`Auto-cleaned ${removed} old sessions to free up space`);
  }
  
  return kept;
}
