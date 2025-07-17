# Related Questions Auto-Submit Fix - July 16, 2025

## Issue
When clicking on related questions in the "People Also Ask" section, the question was populated in the input field but didn't automatically submit the search.

## Root Cause
React's automatic state batching was preventing the form submission from seeing the updated state values. When `handleSubmit` was called, the `message` and `selectedTool` state hadn't been updated yet.

## Solution
Used React's `flushSync` from `react-dom` to force synchronous state updates.

### Changes Made:

1. **Import flushSync** (`/app/page.tsx`):
```typescript
import { flushSync } from "react-dom"
```

2. **Updated handleRelatedQuestionClick**:
```typescript
const handleRelatedQuestionClick = (question: string) => {
  // Use flushSync to ensure state updates are applied synchronously
  flushSync(() => {
    setMessage(question)
    setSelectedTool('searchWeb')
  })
  
  // Now submit the form - state is guaranteed to be updated
  const syntheticEvent = {
    preventDefault: () => {},
  } as React.FormEvent<HTMLFormElement>
  handleSubmit(syntheticEvent)
  
  scrollToBottom()
}
```

3. **Added Debug Logging**:
- Console logs in `handleRelatedQuestionClick` to track state updates
- Console log in `WebSearchResults` onClick handler to confirm clicks

## How It Works

1. User clicks a related question
2. `flushSync` forces React to apply state updates synchronously
3. `setMessage` and `setSelectedTool` complete immediately
4. `handleSubmit` is called with updated state values
5. Form submits successfully with the new search query

## Benefits

- Immediate form submission after clicking
- No delays or timing issues
- More reliable than setTimeout or async approaches
- Works with React's concurrent features

## Testing

Click any question in "People Also Ask" - it should:
1. Populate the input field
2. Select the web search tool
3. Submit immediately
4. Show new search results

Check console for debug messages if issues occur.
