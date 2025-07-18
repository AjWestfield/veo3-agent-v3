import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Shield } from 'lucide-react'

interface CookieManagerProps {
  isOpen: boolean
  onClose: () => void
  onSaveCookies: (cookies: string) => void
  platform: string
}

export function CookieManager({ isOpen, onClose, onSaveCookies, platform }: CookieManagerProps) {
  const [cookies, setCookies] = useState('')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!cookies.trim()) {
      setError('Please provide cookies')
      return
    }
    
    // Basic validation for cookie format
    if (!cookies.includes('=') && !cookies.includes('{')) {
      setError('Invalid cookie format. Please check the instructions.')
      return
    }
    
    onSaveCookies(cookies.trim())
    setCookies('')
    setError('')
  }

  const platformInstructions = {
    youtube: {
      title: 'YouTube Authentication Required',
      steps: [
        'Open YouTube in your browser and sign in',
        'Install a browser extension like "Get cookies.txt LOCALLY" or "EditThisCookie"',
        'Navigate to the YouTube video you want to download',
        'Export cookies in Netscape format using the extension',
        'Paste the exported cookies below'
      ]
    },
    facebook: {
      title: 'Facebook Authentication Required',
      steps: [
        'Open Facebook in your browser and sign in',
        'Install a browser extension like "Get cookies.txt LOCALLY"',
        'Navigate to Facebook while logged in',
        'Export cookies in Netscape format',
        'Paste the exported cookies below'
      ]
    },
    default: {
      title: 'Authentication Required',
      steps: [
        'Sign in to the platform in your browser',
        'Install a cookie export extension',
        'Export cookies in Netscape format',
        'Paste the cookies below'
      ]
    }
  }

  const instructions = platformInstructions[platform as keyof typeof platformInstructions] || platformInstructions.default

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{instructions.title}</DialogTitle>
          <DialogDescription>
            This video requires authentication. Please provide cookies from your browser.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your cookies are used only for this download and are not stored permanently.
            </AlertDescription>
          </Alert>
          
          <div>
            <h4 className="font-medium mb-2">How to get cookies:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              {instructions.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
          
          <div>
            <label htmlFor="cookies" className="text-sm font-medium">
              Paste cookies here:
            </label>
            <Textarea
              id="cookies"
              value={cookies}
              onChange={(e) => {
                setCookies(e.target.value)
                setError('')
              }}
              placeholder="# Netscape HTTP Cookie File&#10;# This is a generated file!  Do not edit.&#10;.youtube.com	TRUE	/	TRUE	..."
              className="mt-2 h-32 font-mono text-xs"
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
          </div>
          
          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Cookie format should be Netscape format (cookies.txt) or JSON format from browser extensions.
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Use Cookies & Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}