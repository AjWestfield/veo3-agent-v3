# Multi-Image Editing Feature

## Overview
The multi-image editing feature allows users to combine and edit multiple images (up to 10) into a single image using the Wavespeed AI Flux Kontext Max Multi model.

## How to Use

### 1. Upload or Generate Images
- First, ensure you have images in your sidebar (either uploaded, generated, or edited)
- Images will appear in the "Images" section of the sidebar

### 2. Access Multi-Image Edit
- Hover over the sidebar to expand it
- In the "Images" section, click the "Edit Multiple" button
- This button only appears when you have at least one image

### 3. Select Images to Edit
- A modal will open showing all your images in a grid
- Click on images to select them (they'll be highlighted with a blue border)
- You can select up to 10 images
- Use "Select All" / "Deselect All" buttons for convenience

### 4. Enter Edit Prompt
- In the text area, describe how you want to combine and edit the images
- Examples:
  - "Combine all elements into a single scene"
  - "A woman wears the dress and the hat, near the sea"
  - "Merge the subjects wearing different outfits"
  - "Create a collage with these images"

### 5. Process and View Results
- Click "Edit X Images" button to start processing
- A loading screen will show while the images are being processed
- Once complete, a result modal will display:
  - The edited/combined image on the left
  - Source images used on the right
  - The prompt used for editing
  - Download button for the result

### 6. Result Storage
- The edited image is automatically added to your sidebar
- It's marked as type "multi-edited" with references to source images
- You can click on it later to view the result modal again

## Technical Details

### API Endpoint
- `/api/edit-multi-images` - Handles multi-image editing requests
- Accepts up to 10 images
- Converts images to appropriate format for Wavespeed API

### Components
- `MultiImageEditModal` - Selection and editing interface
- `MultiImageResult` - Result display modal
- Updated `ImagesContext` - Supports multi-selection state

### Image Context Updates
- Added `selectedImageIds` state for tracking selections
- New methods: `selectImage`, `deselectImage`, `toggleImageSelection`, etc.
- New image type: `multi-edited` with `sourceImages` property

## Limitations
- Maximum 10 images per edit operation
- All images must be accessible (base64, local, or external URLs)
- Processing time depends on number and size of images