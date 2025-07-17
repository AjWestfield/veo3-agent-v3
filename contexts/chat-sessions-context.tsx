"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'
import { Message } from '@/app/page'
import { mediaStorage } from '@/lib/media-storage'
import { 
  cleanSessionForStorage, 
  autoCleanupSessions, 
  getStorageSize,
  getLocalStorageUsage,
  compressString,
  decompressString
} from '@/lib/chat-storage-utils'

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  timestamp: Date
  lastUpdated: Date
}

interface ChatSessionsContextType {
  sessions: ChatSession[]
  currentSessionId: string | null
  currentSession: ChatSession | null
  createNewSession: () => string
  switchToSession: (sessionId: string) => void
  updateCurrentSession: (messages: Message[]) => void
  updateSession: (sessionId: string, messages: Message[]) => void
  deleteSession: (sessionId: string) => void
  generateTitleForSession: (sessionId: string, firstMessage: Message, firstResponse?: Message) => Promise<void>
  clearAllSessions: () => void
  cleanupOldSessions: (keepCount?: number) => void
  storageWarning: string | null
}

const ChatSessionsContext = createContext<ChatSessionsContextType | undefined>(undefined)

const STORAGE_KEY = 'veo3-chat-sessions'
const CURRENT_SESSION_KEY = 'veo3-current-session'

export function ChatSessionsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [storageWarning, setStorageWarning] = useState<string | null>(null)
  const pendingSessionsRef = useRef<Map<string, ChatSession>>(new Map())

  // Load sessions from localStorage on mount
  useEffect(() => {
    const loadSessionsAsync = async () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY)
        const savedCurrentSession = localStorage.getItem(CURRENT_SESSION_KEY)
        
        if (savedData) {
          let sessionsData: any[] = [];
          
          try {
            const parsed = JSON.parse(savedData);
            
            // Handle new format with version
            if (parsed.version === 2) {
              let dataStr = parsed.data;
              
              // Decompress if needed
              if (parsed.compressed && typeof DecompressionStream !== 'undefined') {
                try {
                  dataStr = await decompressString(dataStr);
                } catch (e) {
                  console.error('Failed to decompress sessions:', e);
                }
              }
              
              sessionsData = JSON.parse(dataStr);
            } else {
              // Handle old format (direct array)
              sessionsData = parsed;
            }
          } catch (e) {
            // Try to parse as old format
            console.warn('Failed to parse storage format, trying legacy format:', e);
            sessionsData = JSON.parse(savedData);
          }
          
          // Convert date strings back to Date objects and restore files
          const sessionsWithDates = await Promise.all(sessionsData.map(async (session: any) => {
            // Restore files for each message from IndexedDB
            const messagesWithFiles = await Promise.all(session.messages.map(async (msg: any) => {
              const restoredMessage = {
                ...msg,
                timestamp: new Date(msg.timestamp)
              };
              
              // If message has files with fileIds, restore them from IndexedDB
              if (msg.files && msg.files.length > 0) {
                const restoredFiles = await Promise.all(msg.files.map(async (file: any) => {
                  if (file.fileId) {
                    try {
                      const fileData = await mediaStorage.getFile(file.fileId);
                      if (fileData) {
                        // Create a File object from the stored data
                        const base64Data = fileData.base64Data;
                        const byteCharacters = atob(base64Data.split(',')[1]);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: base64Data.split(':')[1].split(';')[0] });
                        const restoredFile = new File([blob], file.fileName || fileData.fileName, { 
                          type: blob.type 
                        });
                        
                        return {
                          file: restoredFile,
                          preview: fileData.base64Data,
                          type: file.type,
                          fileName: file.fileName || fileData.fileName,
                          fileSize: file.fileSize || fileData.fileSize,
                          fileId: file.fileId,
                          base64Data: fileData.base64Data
                        };
                      }
                    } catch (error) {
                      console.error('Failed to restore file from IndexedDB:', error);
                    }
                  }
                  // If restoration fails or no fileId, return the file as-is
                  return file;
                }));
                
                restoredMessage.files = restoredFiles.filter(f => f !== null);
              }
              
              return restoredMessage;
            }));
            
            return {
              ...session,
              timestamp: new Date(session.timestamp),
              lastUpdated: new Date(session.lastUpdated),
              messages: messagesWithFiles
            };
          }));
          
          setSessions(sessionsWithDates);
          
          // Set current session
          if (savedCurrentSession && sessionsWithDates.find((s: any) => s.id === savedCurrentSession)) {
            setCurrentSessionId(savedCurrentSession);
          } else if (sessionsWithDates.length > 0) {
            setCurrentSessionId(sessionsWithDates[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load chat sessions:', error);
        
        // If loading fails, try to clear corrupted data
        if (error instanceof SyntaxError) {
          console.error('Corrupted session data detected, clearing...');
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(CURRENT_SESSION_KEY);
        }
      }
    };
    
    loadSessionsAsync();
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    // Skip if sessions array is empty (initial load)
    if (sessions.length === 0) return
    
    const saveSessionsAsync = async () => {
      try {
        // Clean sessions to reduce size
        const cleanedSessions = sessions.map(cleanSessionForStorage);
        
        // Check storage usage
        const storageInfo = getLocalStorageUsage();
        if (storageInfo.percentage > 80) {
          console.warn(`Storage usage high: ${storageInfo.percentage.toFixed(1)}%`);
          setStorageWarning(`Storage ${storageInfo.percentage.toFixed(0)}% full. Old sessions may be auto-removed.`);
        }
        
        // Auto cleanup if needed
        let sessionsToSave = cleanedSessions;
        const sizeInMB = getStorageSize(cleanedSessions) / (1024 * 1024);
        
        if (sizeInMB > 3) {
          console.log(`Sessions size: ${sizeInMB.toFixed(2)}MB. Running auto-cleanup...`);
          sessionsToSave = autoCleanupSessions(cleanedSessions, 3);
          
          // Update state with cleaned sessions
          const keptIds = new Set(sessionsToSave.map(s => s.id));
          setSessions(prev => prev.filter(s => keptIds.has(s.id)));
        }
        
        // Try compression if supported
        let dataToStore = JSON.stringify(sessionsToSave);
        let isCompressed = false;
        
        if (typeof CompressionStream !== 'undefined' && sizeInMB > 1) {
          try {
            const compressed = await compressString(dataToStore);
            if (compressed.length < dataToStore.length) {
              dataToStore = compressed;
              isCompressed = true;
              console.log(`Compressed sessions from ${(dataToStore.length / 1024).toFixed(1)}KB to ${(compressed.length / 1024).toFixed(1)}KB`);
            }
          } catch (e) {
            console.warn('Compression failed, using uncompressed data', e);
          }
        }
        
        // Save with metadata
        const storageData = {
          version: 2,
          compressed: isCompressed,
          data: dataToStore,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
        
        if (currentSessionId) {
          localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId);
        }
        
        // Clear warning if save was successful
        if (storageInfo.percentage < 80) {
          setStorageWarning(null);
        }
        
      } catch (error) {
        console.error('Failed to save chat sessions:', error);
        
        // Handle quota exceeded error
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error('Storage quota exceeded. Attempting aggressive cleanup...');
          
          try {
            // Aggressive cleanup - keep only current session
            const currentSession = sessions.find(s => s.id === currentSessionId);
            if (currentSession) {
              const cleaned = cleanSessionForStorage(currentSession);
              const minimalData = {
                version: 2,
                compressed: false,
                data: JSON.stringify([cleaned]),
                timestamp: new Date().toISOString()
              };
              
              // Clear other storage items if needed
              const keysToCheck = ['trackedImages', 'veo3-videos', 'veo3-audios'];
              keysToCheck.forEach(key => {
                try {
                  const item = localStorage.getItem(key);
                  if (item && item.length > 1024 * 1024) { // If > 1MB
                    console.log(`Clearing large item: ${key}`);
                    localStorage.removeItem(key);
                  }
                } catch (e) {
                  console.error(`Failed to clear ${key}:`, e);
                }
              });
              
              // Try to save minimal data
              localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalData));
              setSessions([currentSession]);
              setStorageWarning('Storage was full. Kept only current session. Please export important chats.');
            }
          } catch (e) {
            console.error('Even aggressive cleanup failed:', e);
            setStorageWarning('Storage completely full! Cannot save. Please clear browser data.');
          }
        }
      }
    };
    
    saveSessionsAsync();
  }, [sessions, currentSessionId]);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Chat',
      messages: [],
      timestamp: new Date(),
      lastUpdated: new Date()
    }
    
    // Store the new session temporarily to handle immediate updates
    pendingSessionsRef.current.set(newSession.id, newSession)
    
    // Add to state
    setSessions(prev => {
      // Check if session already exists (in case of duplicate calls)
      if (prev.some(s => s.id === newSession.id)) {
        return prev
      }
      return [newSession, ...prev]
    })
    
    setCurrentSessionId(newSession.id)
    
    // Clean up pending session after a delay
    setTimeout(() => {
      pendingSessionsRef.current.delete(newSession.id)
    }, 2000)
    
    return newSession.id
  }, [])

  const switchToSession = useCallback((sessionId: string) => {
    if (sessions.find(s => s.id === sessionId)) {
      setCurrentSessionId(sessionId)
    }
  }, [sessions])

  const updateCurrentSession = useCallback((messages: Message[]) => {
    if (!currentSessionId) return
    
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId
        ? { ...session, messages, lastUpdated: new Date() }
        : session
    ))
  }, [currentSessionId])
  
  const updateSession = useCallback((sessionId: string, messages: Message[]) => {
    // First check if this is a pending session
    if (pendingSessionsRef.current.has(sessionId)) {
      const pendingSession = pendingSessionsRef.current.get(sessionId)!
      const updatedSession = { ...pendingSession, messages, lastUpdated: new Date() }
      pendingSessionsRef.current.set(sessionId, updatedSession)
    }
    
    setSessions(prev => {
      // Check if session exists in state
      const sessionIndex = prev.findIndex(s => s.id === sessionId)
      
      if (sessionIndex === -1) {
        // Session not in state yet - check if it's in pending
        if (pendingSessionsRef.current.has(sessionId)) {
          const pendingSession = pendingSessionsRef.current.get(sessionId)!
          return [{ ...pendingSession, messages, lastUpdated: new Date() }, ...prev]
        }
        console.warn(`Session ${sessionId} not found`)
        return prev
      }
      
      // Update existing session
      const newSessions = [...prev]
      newSessions[sessionIndex] = {
        ...newSessions[sessionIndex],
        messages,
        lastUpdated: new Date()
      }
      return newSessions
    })
  }, [])

  const deleteSession = useCallback(async (sessionId: string) => {
    // Delete stored files for this session
    try {
      await mediaStorage.deleteFilesBySession(sessionId)
    } catch (error) {
      console.error('Failed to delete session files:', error)
    }
    
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== sessionId)
      
      // If we're deleting the current session, switch to another
      if (sessionId === currentSessionId) {
        if (newSessions.length > 0) {
          setCurrentSessionId(newSessions[0].id)
        } else {
          setCurrentSessionId(null)
        }
      }
      
      return newSessions
    })
  }, [currentSessionId])

  const generateTitleForSession = useCallback(async (sessionId: string, firstMessage: Message, firstResponse?: Message) => {
    setSessions(prev => prev.map(session => {
      if (session.id !== sessionId) return session
      
      let title = 'New Chat'
      
      // Generate title based on the context
      if (firstMessage.files && firstMessage.files.length > 0) {
        const fileTypes = firstMessage.files.map(f => f.type)
        const hasVideo = fileTypes.includes('video')
        const hasImage = fileTypes.includes('image')
        const hasAudio = fileTypes.includes('audio')
        
        if (hasVideo) {
          title = `Video Analysis: ${firstMessage.files[0].file.name.substring(0, 20)}...`
        } else if (hasImage) {
          const imageCount = firstMessage.files.filter(f => f.type === 'image').length
          title = imageCount > 1 ? `${imageCount} Images Analysis` : 'Image Analysis'
        } else if (hasAudio) {
          title = 'Audio Analysis'
        } else {
          title = `File: ${firstMessage.files[0].file.name.substring(0, 25)}...`
        }
        
        // If there's also text, append a summary
        if (firstMessage.content && firstMessage.content.trim() !== 'Uploaded files for analysis') {
          const textSummary = firstMessage.content.substring(0, 30)
          title = `${title} - ${textSummary}...`
        }
      } else if (firstMessage.content) {
        // Text-only message
        const content = firstMessage.content
        
        // Check for specific patterns
        if (content.toLowerCase().includes('create') || content.toLowerCase().includes('generate')) {
          if (content.toLowerCase().includes('image')) {
            title = 'Image Generation'
          } else {
            title = content.substring(0, 40) + '...'
          }
        } else if (content.toLowerCase().includes('edit')) {
          title = 'Image Editing'
        } else if (content.toLowerCase().includes('code') || content.toLowerCase().includes('write')) {
          title = 'Code Generation'
        } else if (content.toLowerCase().includes('search')) {
          title = 'Web Search'
        } else {
          // Use first 40 characters of the message
          title = content.substring(0, 40)
          if (content.length > 40) title += '...'
        }
      }
      
      // If we have a response, we could analyze it for better context
      if (firstResponse?.content) {
        // For VEO 3 prompts, use a specific title
        if (firstResponse.content.includes('VEO 3') && firstResponse.content.includes('CLIP')) {
          const clipMatch = firstResponse.content.match(/(\d+) clips?/i)
          if (clipMatch) {
            title = `VEO 3: ${clipMatch[1]} Clips Generated`
          } else {
            title = 'VEO 3 Prompt Generated'
          }
        }
      }
      
      return { ...session, title }
    }))
  }, [])

  const clearAllSessions = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      setSessions([])
      setCurrentSessionId(null)
      setStorageWarning(null)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(CURRENT_SESSION_KEY)
      // Also clear media storage
      mediaStorage.clearAll().catch(console.error)
    }
  }, [])
  
  const cleanupOldSessions = useCallback((keepCount: number = 20) => {
    setSessions(prev => {
      const recentSessions = prev.slice(0, keepCount)
      // Delete media for removed sessions
      const removedSessions = prev.slice(keepCount)
      removedSessions.forEach(session => {
        mediaStorage.deleteFilesBySession(session.id).catch(console.error)
      })
      setStorageWarning(null) // Clear warning after cleanup
      return recentSessions
    })
  }, [])

  const currentSession = sessions.find(s => s.id === currentSessionId) || null

  return (
    <ChatSessionsContext.Provider
      value={{
        sessions,
        currentSessionId,
        currentSession,
        createNewSession,
        switchToSession,
        updateCurrentSession,
        updateSession,
        deleteSession,
        generateTitleForSession,
        clearAllSessions,
        cleanupOldSessions,
        storageWarning
      }}
    >
      {children}
    </ChatSessionsContext.Provider>
  )
}

export function useChatSessions() {
  const context = useContext(ChatSessionsContext)
  if (context === undefined) {
    throw new Error('useChatSessions must be used within a ChatSessionsProvider')
  }
  return context
}