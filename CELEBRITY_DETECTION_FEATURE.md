# Celebrity Detection Feature

## Overview
The VEO3 Agent now includes automatic celebrity and public figure detection when analyzing images and videos. This feature helps users identify well-known people in their media content.

## How It Works

### Automatic Detection
When you upload an image or video without a specific message, the system automatically includes instructions to identify any public figures or celebrities present in the content.

### Enhanced Analysis
When you provide a message along with your media, the system enhances it with celebrity detection capabilities unless you're generating a VEO 3 prompt.

### What Gets Detected
The system will attempt to identify and provide information about:
- Actors and actresses
- Musicians and performers
- Politicians and public officials
- Athletes and sports figures
- Social media influencers
- Business leaders
- Other notable public figures

### Information Provided
For each identified person, the analysis includes:
1. Their full name
2. What they are known for (e.g., "Actor known for Marvel movies")
3. Their appearance in the specific image/video
4. Their role or context in the content

## Usage Examples

### Example 1: Image Analysis
Upload an image and the system will automatically detect any celebrities:
- Input: Upload photo from a movie premiere
- Output: "In this image, I can see Robert Downey Jr., the actor known for playing Iron Man in the Marvel Cinematic Universe..."

### Example 2: Video Analysis
Upload a video for standard analysis:
- Input: Upload video clip from a talk show
- Output: "The video features Jimmy Fallon, the comedian and host of The Tonight Show..."

### Example 3: VEO 3 Prompts
For VEO 3 prompt generation, celebrity detection is included in the video analysis phase to help create more accurate prompts.

## Technical Implementation

The feature is implemented in the `/app/api/chat/route.ts` file:

1. **Detection Logic**: Checks if uploaded files are images or videos
2. **Message Enhancement**: Adds celebrity detection instructions to the AI model
3. **Context Preservation**: Maintains original user intent while adding detection capabilities
4. **VEO 3 Integration**: Special handling for VEO 3 prompt generation requests

## Privacy Note
This feature only identifies public figures and celebrities who are already in the public domain. It does not attempt to identify private individuals.