import { useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T, options?: {
  maxItems?: number
  maxSizeMB?: number
}) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      // Apply limits if specified
      let dataToStore = valueToStore
      
      if (options?.maxItems && Array.isArray(dataToStore)) {
        dataToStore = dataToStore.slice(0, options.maxItems) as T
      }
      
      const stringified = JSON.stringify(dataToStore)
      
      // Check size if limit specified
      if (options?.maxSizeMB) {
        const sizeMB = new Blob([stringified]).size / (1024 * 1024)
        if (sizeMB > options.maxSizeMB) {
          console.warn(`Storage size (${sizeMB.toFixed(2)}MB) exceeds limit (${options.maxSizeMB}MB)`)
          if (Array.isArray(dataToStore)) {
            // Try to reduce array size
            const reduced = dataToStore.slice(0, Math.floor(dataToStore.length / 2)) as T
            window.localStorage.setItem(key, JSON.stringify(reduced))
            return
          }
        }
      }
      
      window.localStorage.setItem(key, stringified)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded. Clearing storage...')
        // Clear this specific key and try again
        window.localStorage.removeItem(key)
        try {
          // If it's an array, save only recent items
          if (Array.isArray(storedValue)) {
            const recent = storedValue.slice(0, 5) as T
            window.localStorage.setItem(key, JSON.stringify(recent))
          }
        } catch (retryError) {
          console.error('Failed to save even after cleanup:', retryError)
        }
      } else {
        console.error(`Error saving ${key} to localStorage:`, error)
      }
    }
  }

  const clearValue = () => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error clearing ${key} from localStorage:`, error)
    }
  }

  return [storedValue, setValue, clearValue] as const
}
