# People Also Ask Auto-Submit - Final Fix

## Issue
When clicking on questions in the "People Also Ask" section, the query was being populated in the input field but not auto-submitting.

## Root Cause
The previous implementation was calling `handleSubmit` directly after using `flushSync`, but `handleSubmit` was using the `message` value from its closure, which still contained the old value. Even though `flushSync` updates React state synchronously, function closures capture values at the time they're created.

## Solution
Instead of calling `handleSubmit` with a synthetic event, we now:
1. Use `flushSync` to update the state synchronously
2. Use `requestAnimationFrame` to wait for the next frame (ensuring DOM updates)
3. Submit the form directly using `formElement.requestSubmit()`

## Implementation
```typescript
const handleRelatedQuestionClick = (question: string) => {
  console.log('Related question clicked:', question)
  
  // Clear any files first
  setFilesWithPreviews([])
  
  // Use flushSync to ensure state updates are applied synchronously
  flushSync(() => {
    setMessage(question)
    setSelectedTool('searchWeb')
  })
  
  // Now submit the form using requestAnimationFrame to ensure DOM is updated
  requestAnimationFrame(() => {
    const formElement = document.querySelector('form') as HTMLFormElement
    if (formElement) {
      console.log('Submitting form with question:', question)
      formElement.requestSubmit()
    }
  })
  
  // Scroll to bottom to show the new search
  scrollToBottom()
}
```

## Why This Works
1. `flushSync` ensures React state is updated immediately
2. `requestAnimationFrame` ensures the DOM has been updated with the new state values
3. `formElement.requestSubmit()` triggers the actual form submission, which reads the current values from the form inputs (which have been updated)
4. This avoids closure issues since the form submission reads from the DOM, not from JavaScript closures

## Testing
Click any question in "People Also Ask" - it should now:
1. Update the input field with the question text
2. Select the web search tool
3. Auto-submit the form immediately
4. Start a new search with the selected question