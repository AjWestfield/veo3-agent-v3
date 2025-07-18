# Video Generation Test Guide

## Test 1: VEO 3 Fast (Text-to-Video)
1. Open the app
2. Click on "Generate video" tool in the chat input
3. Enter prompt: "A serene mountain landscape with clouds moving across the sky"
4. Check settings - VEO 3 Fast should be selected (8 seconds fixed)
5. Submit and watch for:
   - Video placeholder animation appears
   - Progress bar shows
   - Model shows "VEO 3 Fast"
   - After generation, video should display in chat with controls
   - Video should appear in sidebar

## Test 2: Kling 2.1 AI (Text-to-Video)
1. Open settings (gear icon in sidebar)
2. Go to Video Generation tab
3. Switch model to "Kling 2.1 AI"
4. Set duration to 5 seconds
5. Close settings
6. Click "Generate video" tool
7. Enter prompt: "A butterfly landing on a flower in slow motion"
8. Submit and watch for:
   - Video placeholder animation appears
   - Model shows "Kling 2.1 AI"
   - After generation, video should display in chat
   - Video should appear in sidebar

## Test 3: Kling 2.1 AI (Image-to-Video)
1. Upload an image first (drag and drop or paste)
2. Keep Kling 2.1 AI selected
3. Click "Generate video" tool
4. Enter prompt: "Animate with gentle movement"
5. The uploaded image should be used as the starting frame
6. Video should generate and display

## Things to Verify:
- [x] Video placeholder shows during generation
- [x] Progress bar animates
- [x] Videos display with controls (play, pause, volume)
- [x] Videos auto-play and loop
- [x] Videos appear in sidebar
- [x] Settings persist between sessions
- [x] Error handling for invalid inputs
- [x] No "preparing response" text for video generation

## Expected Durations:
- VEO 3 Fast: ~45-60 seconds
- Kling 2.1 AI: ~60-90 seconds