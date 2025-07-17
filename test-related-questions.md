# Testing Related Questions Auto-Submit

## Test Instructions

1. Open the app at http://localhost:3000
2. Perform a web search (e.g., search for "Warren Buffett")
3. Wait for the results to load and scroll down to the "People Also Ask" section
4. Click on any of the numbered questions
5. Verify that:
   - The question text is automatically filled in the input
   - The web search tool is selected
   - The form submits automatically without any additional action
   - A new search begins with the clicked question

## Expected Behavior

When clicking on a related question:
- The input field should update immediately with the question text
- The form should submit automatically within milliseconds
- No manual submit button click should be required
- The page should scroll to show the new search results

## Fix Applied

Changed from `setTimeout` approach to `flushSync`:
- Uses `flushSync` to ensure React state updates are applied synchronously
- Calls `handleSubmit` directly instead of DOM manipulation
- Eliminates timing issues and makes auto-submit reliable

## Console Logs

You should see these console logs when clicking a question:
1. "Related question clicked: [question text]"
2. "Submitting form with question: [question text] tool: searchWeb"
3. "handleSubmit called - message: [question text] tool: searchWeb"