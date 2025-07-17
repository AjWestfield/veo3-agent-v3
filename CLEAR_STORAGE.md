# Clear Browser Storage

If you're experiencing localStorage quota errors, you can clear your browser storage by:

## Option 1: Browser Console (Recommended)
1. Open browser console (F12)
2. Run this command:
   ```javascript
   localStorage.clear()
   ```
3. Refresh the page

## Option 2: Browser Settings
### Chrome/Edge:
1. Press F12 to open DevTools
2. Go to Application tab
3. Click on "Local Storage" in the left sidebar
4. Right-click on your domain (localhost:3001)
5. Click "Clear"

### Firefox:
1. Press F12 to open DevTools
2. Go to Storage tab
3. Expand "Local Storage"
4. Right-click on your domain
5. Click "Delete All"

## Option 3: Clear All Site Data
1. Click the lock icon in the address bar
2. Click "Site settings" or "Cookies and site data"
3. Click "Clear data"

After clearing, refresh the page and the app will work normally.
