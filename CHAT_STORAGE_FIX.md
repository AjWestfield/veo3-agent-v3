# Chat Sessions Storage Fix

## Problem
The application was throwing a `QuotaExceededError` when trying to save chat sessions to localStorage. This happens when the browser's storage quota (typically 5-10MB) is exceeded by storing too much data, including chat messages with embedded images, videos, and other large content.

## Solution Implemented

### 1. **Storage Optimization**
- Created `chat-storage-utils.ts` with utilities for:
  - Cleaning messages by removing base64 encoded media content
  - Compressing data using the native CompressionStream API
  - Monitoring storage usage and providing warnings
  - Automatic cleanup of old sessions when storage is getting full

### 2. **Automatic Cleanup**
- When storage exceeds 3MB, old sessions are automatically removed
- Sessions are sorted by `lastUpdated` date, keeping the most recent ones
- If quota is still exceeded, only the current session is kept

### 3. **Compression Support**
- Data is compressed using gzip when supported by the browser
- Typically reduces storage by 50-70% for text content
- Backward compatible with browsers that don't support compression

### 4. **Media Content Handling**
- Base64 encoded images, videos, and audio are replaced with placeholders
- Media files are already stored separately in IndexedDB
- Only metadata is kept in localStorage messages

### 5. **User Interface**
- Added `StorageWarning` component that shows when storage is getting full
- Displays current storage usage and available space
- Provides buttons to:
  - View storage information
  - Clean old sessions
  - Clear all sessions

## How It Works

1. **On Save**: 
   - Messages are cleaned to remove large media content
   - Data is compressed if supported
   - Auto-cleanup runs if size exceeds 3MB
   - Aggressive cleanup if quota is still exceeded

2. **On Load**:
   - Detects storage format version
   - Decompresses data if needed
   - Handles legacy uncompressed format

3. **Warning System**:
   - Shows warning when storage exceeds 80%
   - Provides user actions to manage storage
   - Prevents data loss by proactive cleanup

## User Actions

When you see the storage warning:

1. **Clean Old Sessions**: Removes older chat sessions to free space
2. **Clear All**: Removes all chat sessions (use with caution)
3. **Storage Info**: Shows detailed storage usage statistics

## Best Practices

1. Regularly clean old sessions you don't need
2. Export important chats before clearing storage
3. Avoid storing very large conversations with many images
4. The system will automatically manage storage, but manual cleanup helps

## Technical Details

- Storage limit: ~5MB for localStorage (browser dependent)
- Auto-cleanup threshold: 3MB
- Warning threshold: 80% of estimated capacity
- Compression: Uses native gzip when available
- Media storage: IndexedDB (separate from chat sessions)

## Future Improvements

1. Export/import functionality for chat sessions
2. Cloud backup option for important chats
3. Migration to IndexedDB for unlimited storage
4. Configurable retention policies
