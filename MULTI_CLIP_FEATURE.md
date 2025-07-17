# Multi-Clip Video Analysis Feature

## Overview
The VEO3 Agent now supports multi-clip video analysis for videos longer than 8 seconds. This feature allows users to split longer videos into multiple 8-second clips, each with its own VEO 3 prompt.

## How to Use

1. **Upload a Video**: Drag and drop or select a video file
2. **Select Number of Clips**: 
   - Choose "Auto-detect" to let AI determine scene changes
   - Choose 1-8 clips for manual specification
3. **Analyze**: The AI will generate separate VEO 3 prompts for each clip

## Features

- **Auto Scene Detection**: AI analyzes natural scene breaks, camera angle changes, and transitions
- **Individual Copy Buttons**: Each clip has its own copy button for easy use
- **Timestamp Information**: Each clip shows its timestamp range
- **Official VEO 3 Format**: All prompts follow the official template structure

## Example Output

When analyzing a multi-clip video, you'll see:

```
VEO 3 MULTI-CLIP ANALYSIS:
Found 3 clips. Each clip is approximately 8 seconds.

## CLIP 1 of 3 [Timestamp: 00:00-00:08]
[VEO 3 prompt content with CLIP, STYLE, VISUAL_DESCRIPTION, etc.]

## CLIP 2 of 3 [Timestamp: 00:08-00:16]
[VEO 3 prompt content...]

## CLIP 3 of 3 [Timestamp: 00:16-00:24]
[VEO 3 prompt content...]
```

Each clip can be copied individually using the "Copy Clip" button.

## Technical Details

- Maximum 8 clips supported (for videos up to 64 seconds)
- Each clip targets ~8 seconds for optimal VEO 3 generation
- Prompts include all required sections: CLIP, STYLE, VISUAL_DESCRIPTION, DIALOGUE, TIMELINE & CAMERA ACTION, AUDIO, CAMERA STYLE, and NEGATIVE_PROMPT