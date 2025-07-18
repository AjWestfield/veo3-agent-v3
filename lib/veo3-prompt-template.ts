// Enhanced VEO 3 Prompt Template for Accurate Video Recreation
// This template provides comprehensive details to enable precise video replication

export const getVEO3PromptTemplate = (isAutoDetect: boolean, numClips?: number) => {
  const baseInstructions = `Analyze this video with EXTREME DETAIL to enable accurate recreation. Your analysis must capture every visual element, movement, and nuance that would allow someone to recreate this exact video using VEO 3.

IMPORTANT FIRST STEP - Subject Identification:
1. Identify any people, animals, or key subjects in the video
2. If public figures/celebrities are present, name them and their known work
3. Describe physical characteristics in detail (height, build, hair, clothing, accessories)
4. Note any distinctive features or mannerisms

CRITICAL: Your prompt must be so detailed that it reverse-engineers the video completely.`;

  const clipAnalysisTemplate = `
## CLIP \${clipNumber} of \${totalClips} [Timestamp: XX:XX-XX:XX]

CLIP: [Comprehensive 2-3 sentence summary capturing the complete narrative arc, key actions, and emotional journey of this 8-second segment]

STYLE: [Cinematic style analysis including:
- Resolution: 8K
- Film genre aesthetic (documentary, commercial, cinematic, vlog, etc.)
- Color grading (warm/cool tones, contrast levels, saturation)
- Film stock emulation if applicable
- Visual mood and atmosphere
- Reference to similar films/directors if relevant]

TECHNICAL_SPECIFICATIONS:
- Aspect Ratio: [16:9, 2.35:1, 1:1, 9:16, etc.]
- Frame Rate: [24fps cinematic, 30fps standard, 60fps smooth, etc.]
- Depth of Field: [Shallow/deep, f-stop estimate, bokeh quality]
- Shutter Speed Effect: [Motion blur amount, crisp or dreamy]
- ISO/Grain: [Clean or film grain present]
- Lens Type: [Wide angle 14-24mm, normal 35-50mm, telephoto 70-200mm, etc.]

COLOR_PALETTE:
- Primary Colors: [Exact color descriptions with hex codes if possible]
- Secondary Colors: [Supporting color scheme]
- Color Temperature: [Kelvin value estimate: 3200K warm, 5600K daylight, 7000K cool]
- Color Contrast: [Complementary, analogous, monochromatic]
- Special Color Effects: [Color isolation, duotone, etc.]

LIGHTING_SETUP:
- Primary Light Source: [Natural sun/artificial, direction, intensity, quality]
- Key Light Position: [Front, 45°, side, back]
- Fill Light: [Present/absent, ratio to key]
- Rim/Hair Light: [Present/absent, color, intensity]
- Practical Lights: [Any lights visible in frame]
- Shadows: [Hard/soft, direction, density]
- Time of Day: [Golden hour, midday, blue hour, night]
- Weather Conditions: [Clear, cloudy, foggy, rain, snow]

VISUAL_DESCRIPTION: [Ultra-detailed breakdown including:

SUBJECTS/CHARACTERS:
- Physical Appearance: [Age, ethnicity, height, build, hair color/style]
- Clothing: [Exact items, colors, brands if visible, condition, fit]
- Accessories: [Jewelry, watches, bags, technology]
- Facial Features: [Eye color, expressions, makeup if any]
- Body Language: [Posture, gestures, movement quality]
- Emotional State: [Confident, nervous, joyful, contemplative]

ENVIRONMENT/SETTING:
- Location Type: [Indoor/outdoor, specific venue type]
- Architecture: [Modern, classical, industrial, natural]
- Textures: [Rough concrete, smooth glass, weathered wood, etc.]
- Props/Objects: [Every visible object and its placement]
- Background Elements: [Static and moving elements]
- Foreground Elements: [Objects between camera and subject]
- Spatial Relationships: [Distances, positions, arrangements]

COMPOSITION:
- Rule of Thirds: [Subject placement in frame]
- Leading Lines: [Architectural or natural lines guiding eye]
- Framing: [Natural frames within the shot]
- Balance: [Symmetrical, asymmetrical, dynamic]
- Negative Space: [Amount and placement]
- Layers: [Foreground, midground, background separation]]

MOTION_DYNAMICS:
- Subject Movement: [Speed, direction, acceleration, gesture timing]
- Camera Movement: [Speed, smoothness, acceleration curves]
- Background Motion: [Wind in trees, passing people, vehicles]
- Motion Blur: [Present on moving elements, amount]
- Stabilization: [Handheld shake amount, gimbal smoothness]

DIALOGUE:
(00:00.5) [Speaker identification, emotional tone, volume]
"Exact words spoken with proper punctuation and emphasis."
(00:03.2) [Speaker, any change in emotion or delivery]
"Continuation of dialogue with natural pauses..."
[If no dialogue, write: None - Ambient sound only]

DETAILED_TIMELINE:
(00:00.0-00:01.0) [Opening frame: Exact camera position, subject position, initial movement direction, focus point]
(00:01.0-00:02.0) [Movement progression: Speed changes, direction shifts, focus pulls]
(00:02.0-00:03.0) [Mid-point developments: New elements entering frame, gesture details]
(00:03.0-00:04.0) [Emotional shifts: Expression changes, body language evolution]
(00:04.0-00:05.0) [Camera technique: Any pans, tilts, dolly movements with exact speeds]
(00:05.0-00:06.0) [Subject interactions: With environment or other subjects]
(00:06.0-00:07.0) [Climax moment: Peak action or emotional point]
(00:07.0-00:08.0) [Resolution: Final positions, expressions, camera settling]

AUDIO_LANDSCAPE:
- Ambient Base: [Room tone, outdoor ambience level]
- Primary Sounds: [Footsteps, breathing, clothing rustles]
- Environmental Sounds: [Wind speed/direction, water, traffic distance]
- Incidental Sounds: [Birds, distant conversations, machinery]
- Audio Perspective: [Close mic'd, natural distance, reverb amount]
- Unique Audio Signatures: [Specific sound that defines the scene]

CAMERA_STYLE:
- Shot Type: [Continuous take, handheld, gimbal, drone, static tripod]
- Movement Pattern: [Linear, curved, orbit, parallax]
- Stabilization Level: [Rock steady to handheld shake amount]
- Focus Technique: [Fixed, follow focus, rack focus moments]
- Zoom Usage: [None, subtle push in/out, dramatic zoom]
- Height: [Ground level, eye level, high angle, bird's eye]
- Dutch Angle: [If tilted, specify degrees]

ATMOSPHERIC_ELEMENTS:
- Air Quality: [Clear, hazy, foggy, dusty]
- Particles: [Dust motes, rain, snow, leaves]
- Wind: [Still, light breeze, strong wind - effect on hair/clothes]
- Temperature Indicators: [Breath visible, heat shimmer, condensation]
- Humidity: [Dry, humid - effect on atmosphere]

TEXTURE_DETAILS:
- Skin: [Smooth, weathered, sweaty, dry]
- Fabrics: [Cotton, silk, denim, leather - wrinkles, movement]
- Surfaces: [Reflective, matte, rough, smooth]
- Natural Elements: [Bark texture, water surface, ground type]

POST_PROCESSING_STYLE:
- Film Emulation: [Specific film stock look if any]
- Color Grading: [Teal/orange, desaturated, vibrant, bleach bypass]
- Vignetting: [Amount and style]
- Lens Effects: [Flares, chromatic aberration, distortion]
- Sharpening: [Amount and style]

EMOTIONAL_NARRATIVE:
- Opening Emotion: [Starting emotional state]
- Emotional Arc: [How feelings evolve through the clip]
- Climax Emotion: [Peak emotional moment]
- Resolution: [Final emotional state]

NEGATIVE_PROMPT: [Comprehensive list of what must NOT appear:
- Visual Elements: no text overlays, no logos, no watermarks, no UI elements
- Style Choices: no jump cuts, no transitions, no split screens, no picture-in-picture
- Content: no violence, no blood, no horror elements, no explicit content
- Technical: no glitches, no artifacts, no compression issues
- Camera: no crash zooms, no whip pans beyond natural movement
- Audio: no background music unless diegetic, no voiceover
- Effects: no CGI elements unless naturally occurring, no unrealistic physics]

RECREATION_NOTES: [Specific tips for recreating this exact shot:
- Critical timing points that must be hit
- Specific gestures or expressions that define the clip
- Exact camera movement speeds and curves
- Key frames that must match precisely]

---`;

  if (isAutoDetect) {
    return `${baseInstructions}

Then, determine the total duration of the video. If the video is longer than 8 seconds, automatically divide it into multiple 8-second clips.

For videos longer than 8 seconds:
- Calculate how many 8-second clips are needed (e.g., 24-second video = 3 clips)
- Each clip should be exactly 8 seconds (except possibly the last one)
- Provide a separate VEO 3 prompt for EACH 8-second segment
- Ensure continuity between clips while maintaining individual clip integrity

Start your response with: "VEO 3 AUTO-DETECTED CLIPS ANALYSIS:"
Then indicate: "Video Duration: [XX seconds] | Number of 8-second clips: [N]"

${clipAnalysisTemplate}

If the video is 8 seconds or shorter, provide just ONE clip analysis.
Each section header must be in CAPS followed by a colon. Include ALL sections even if some have minimal content.`;
  } else if (numClips && numClips > 1) {
    return `${baseInstructions}

Analyze this video and detect ${numClips} distinct clips/scenes (approximately 8 seconds each). For EACH clip, provide a separate VEO 3 prompt using the comprehensive template.

Start your response with: "VEO 3 MULTI-CLIP ANALYSIS:"

${clipAnalysisTemplate}

Repeat this exact structure for each of the ${numClips} clips. Each section header must be in CAPS followed by a colon.`;
  } else {
    return `${baseInstructions}

Analyze this video and provide a VEO 3 prompt that captures EVERY detail needed for recreation.

Start your response with: "VEO 3 PROMPT:"

${clipAnalysisTemplate}

IMPORTANT: Your analysis must be so thorough that someone could recreate this exact video without having seen the original.`;
  }
};

// Helper function to validate if a generated prompt contains all required sections
export const validateVEO3Prompt = (prompt: string): { isValid: boolean; missingSections: string[] } => {
  const requiredSections = [
    'CLIP:',
    'STYLE:',
    'TECHNICAL_SPECIFICATIONS:',
    'COLOR_PALETTE:',
    'LIGHTING_SETUP:',
    'VISUAL_DESCRIPTION:',
    'MOTION_DYNAMICS:',
    'DIALOGUE:',
    'DETAILED_TIMELINE:',
    'AUDIO_LANDSCAPE:',
    'CAMERA_STYLE:',
    'ATMOSPHERIC_ELEMENTS:',
    'TEXTURE_DETAILS:',
    'POST_PROCESSING_STYLE:',
    'EMOTIONAL_NARRATIVE:',
    'NEGATIVE_PROMPT:',
    'RECREATION_NOTES:'
  ];

  const missingSections = requiredSections.filter(section => !prompt.includes(section));
  
  return {
    isValid: missingSections.length === 0,
    missingSections
  };
};