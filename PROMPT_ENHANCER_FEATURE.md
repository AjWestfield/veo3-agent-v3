# Prompt Enhancer Feature

## Overview
The prompt enhancer feature helps users create more detailed and contextually relevant prompts by analyzing the current prompt and chat history.

## How to Use

1. **Type your prompt**: Enter your message in the chat input field
2. **Click the sparkles button**: The sparkles icon (✨) will appear when you have text in the input
3. **Wait for enhancement**: The AI will analyze your prompt and the conversation context
4. **Review the enhanced prompt**: The input will update with a more detailed version
5. **Undo/Redo**: Use the undo (↶) and redo (↷) buttons to navigate between versions
6. **Submit**: Send the enhanced prompt when satisfied

## Features

- **Context-aware enhancement**: Considers the last 5 messages in the chat history
- **Undo/Redo functionality**: Navigate between original and enhanced versions
- **Auto-reset**: Enhancement state resets when you manually edit the prompt
- **Loading indicator**: Shows a spinner while enhancing

## Technical Details

- **API Endpoint**: `/api/enhance-prompt`
- **Model**: Uses Google Gemini Pro for prompt enhancement
- **State Management**: Maintains prompt history for undo/redo functionality

## Implementation Files

- `/app/api/enhance-prompt/route.ts` - API endpoint
- `/app/page.tsx` - UI integration and state management
- `/components/ui/chatgpt-prompt-input.tsx` - Reusable prompt box component (alternative implementation)