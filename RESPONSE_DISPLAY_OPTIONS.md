# Response Display Options

Since the current implementation shows Gemini responses in an alert dialog, here are some better options that maintain the centered UI design:

## Option 1: Response Below Input (Recommended)
```tsx
// Add a response state
const [response, setResponse] = useState<string>("")

// In handleSubmit, instead of alert:
setResponse(data.response)

// Below the form:
{response && (
  <div className="mt-6 p-4 bg-[#2f2f2f] rounded-2xl border border-[#4a4a4a] max-w-xl">
    <p className="text-white whitespace-pre-wrap">{response}</p>
    <button 
      onClick={() => setResponse("")}
      className="mt-2 text-sm text-gray-400 hover:text-white"
    >
      Clear
    </button>
  </div>
)}
```

## Option 2: Modal Dialog
Use the existing Dialog component from your UI library to show responses in a nice modal.

## Option 3: Expandable Panel
Add a collapsible panel that slides up from the bottom with the response.

## Option 4: Toast Notifications
For short responses, use toast notifications in the corner.

## Option 5: Side Panel
Add a slide-out panel from the right that shows response history.

All these options maintain the centered design while providing better UX than alert dialogs.
