# VEO3 Video Analysis & Prompt Generation Feature

## Overview
This feature transforms video uploads into official VEO 3 prompts using the exact template format required for best results. The entire analysis follows the structured template - ready to copy and paste directly into VEO 3.

## How It Works

### 1. **Upload a Video**
- Click the attachment icon in the chat
- Select a video file (MP4, MOV, AVI, WebM up to 1GB)
- The video uploads and processes automatically

### 2. **Get Your VEO 3 Prompt**
- The response starts with "VEO 3 PROMPT:"
- Everything after that is your ready-to-use prompt in the official template format
- A "Copy Prompt" button appears in the top-right corner
- Click to copy the entire prompt to your clipboard

### 3. **Official Template Structure**
The prompt uses the exact VEO 3 template with these sections:
- **CLIP**: Brief summary of the entire 8-second scene
- **STYLE**: Visual style including resolution, lighting, and tone
- **VISUAL_DESCRIPTION**: Detailed breakdown of characters, setting, and visuals
- **DIALOGUE**: Timestamped dialogue with character names and tones
- **TIMELINE & CAMERA ACTION**: Shot-by-shot camera movements (00:00-00:08)
- **AUDIO**: Ambient sounds and SFX (no music unless diegetic)
- **CAMERA STYLE**: One continuous shot specification
- **NEGATIVE_PROMPT**: What should NOT appear

## Example Output

```
VEO 3 PROMPT:

CLIP: A barista in a modern coffee shop prepares a latte while chatting with a customer, finishing with intricate latte art as morning light streams through windows.

STYLE: Hyper-realistic 8K footage, natural morning light, warm tones, documentary-style handheld camera. Soft depth of field with professional lens aesthetic.

VISUAL_DESCRIPTION: Young female barista in black apron and white shirt stands behind espresso machine in minimalist coffee shop. Male customer in business casual leans on counter. Steam rises from milk pitcher, ceramic cups line the counter, plants visible in background windows.

DIALOGUE:
(00:01) [Barista, friendly tone]
"Your usual cappuccino?"
(00:03) [Customer, relaxed]
"Actually, make it a latte today."
(00:06) [Barista, cheerful]
"Coming right up!"

TIMELINE & CAMERA ACTION:
(00:00–00:02) Camera on barista's hands operating espresso machine, steam visible.
(00:02–00:04) Slight pan to show customer interaction at counter.
(00:04–00:06) Focus shifts to milk being poured, creating latte art pattern.
(00:06–00:08) Pull back to show completed drink sliding across counter.

AUDIO: Espresso machine hissing, milk steaming, ambient café chatter, ceramic cups clinking, soft indie music in background.

CAMERA STYLE: One continuous handheld shot with subtle documentary-style movement. No cuts, no transitions, natural handheld stability.

NEGATIVE_PROMPT: no text, no captions, no subtitles, no logos, no watermarks, no jump cuts, no extreme camera movements, no artificial lighting.
```

## Key Features

### ✅ **Official Template Format**
- Uses the exact structure required by VEO 3
- All sections clearly labeled and formatted
- Policy-compliant content guidelines

### ✅ **One-Click Copy**
- Copy button appears automatically for VEO 3 prompts
- Copies entire template including all sections
- Visual feedback when copied

### ✅ **Comprehensive Analysis**
- Every required section populated with video details
- Timestamps for dialogue and camera movements
- Specific technical details for recreation

### ✅ **Ready to Use**
- Paste directly into VEO 3
- No editing or formatting needed
- Follows all content policies

## Technical Details

- **Gemini 2.0 Flash**: Powers the video analysis
- **File Size**: Supports videos up to 1GB
- **Formats**: MP4, MOV, AVI, WebM
- **Processing**: Real-time progress updates during upload
- **Output**: 8-second video prompts (VEO 3 standard)

## Content Guidelines

The system automatically ensures prompts comply with VEO 3 policies:
- ✅ One continuous shot (no cuts)
- ✅ No violence or horror elements
- ✅ Appropriate content only
- ✅ Clear negative prompts included
- ✅ 8-second duration focus

## Best Practices

1. **Upload Clear Videos**: Better quality = more accurate analysis
2. **Include Dialogue**: System will transcribe with timestamps
3. **Varied Camera Movement**: Will be captured in TIMELINE section
4. **Use Template As-Is**: Format is optimized for VEO 3
5. **Check Compliance**: System ensures policy-safe content

The entire system follows the official VEO 3 template structure for best results.