# VEO3 Agent v2 - Advanced AI Chat with Web Search, Multi-Image Editing & More

> A next-generation AI chat application featuring web search capabilities, multi-image editing, prompt enhancement, and comprehensive media support. Built with Next.js 15, React 19, and integrated with Google Gemini AI, OpenAI, Perplexity, and Wavespeed APIs.

## 🚀 Key Features

### Core AI Capabilities
- **Advanced AI Chat**: Google Gemini AI integration with streaming responses
- **Web Search Integration**: Real-time web search using Perplexity AI with citations
- **Multi-Image Editing**: Edit multiple images simultaneously (up to 10) with AI
- **Prompt Enhancement**: AI-powered prompt improvement for better results
- **Image Generation**: Create images using OpenAI GPT or Wavespeed Flux models
- **Single Image Editing**: Edit individual images with natural language
- **Video Processing**: Upload, download, and analyze video content
- **Audio Analysis**: Process and analyze audio files
- **Multi-Modal Support**: Handle images, videos, audio, and documents

### Advanced Features
- **Web Search Results**: 
  - Rich search results with sources and citations
  - Related images gallery with lightbox view
  - "People Also Ask" section with auto-submit
  - Search progress animations
- **Multi-Image Workflow**:
  - Visual image selector with checkbox UI
  - Select all/deselect all functionality
  - Combine and transform multiple images
- **Chat Session Management**: 
  - Persistent chat history
  - Multiple concurrent sessions
  - Local storage with compression
- **Media Persistence**: 
  - Images, videos, and audio saved locally
  - Drag & drop file upload
  - File size validation
- **Enhanced UI/UX**:
  - Dark theme with smooth animations
  - Responsive design for all devices
  - Loading placeholders and progress indicators
  - Toast notifications
  - Keyboard shortcuts

## 📋 Prerequisites

- **Node.js**: v20.0.0 or higher (tested with v20.19.3)
- **npm**: v10.0.0 or higher
- **Git**: For cloning the repository
- **API Keys**: Required for AI services (see Environment Setup)
- **Storage**: ~500MB for dependencies and media files

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ajwestfield/veo3-agent-v2.git
cd veo3-agent-v2
```

### 2. Checkout the Stable Version

```bash
git checkout tags/web-search-working-and-multi-edit-image-and-prompt-enhancer -b stable-v2
```

### 3. Install Dependencies

```bash
npm install
```

This will automatically install all dependencies including the yt-dlp binary for video processing.

### 4. Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Google Gemini AI API Key (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API Key (Optional - for GPT image generation)
OPENAI_API_KEY=your_openai_api_key_here

# Wavespeed API Key (Required for image editing)
WAVESPEED_API_KEY=your_wavespeed_api_key_here

# Perplexity API Key (Required for web search)
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

#### 🔐 Getting API Keys

1. **Google Gemini AI**: https://makersuite.google.com/app/apikey
2. **OpenAI**: https://platform.openai.com/api-keys
3. **Wavespeed**: https://wavespeed.ai/
4. **Perplexity**: https://www.perplexity.ai/settings/api

**Security Note**: Never commit your `.env.local` file to version control.

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
veo3-agent-v2/
├── app/                         # Next.js 15 App Router
│   ├── api/                     # API Routes
│   │   ├── chat/               # Main chat endpoint with Gemini AI
│   │   ├── search-web/         # Web search with Perplexity AI
│   │   ├── edit-multi-images/  # Multi-image editing endpoint
│   │   ├── enhance-prompt/     # Prompt enhancement endpoint
│   │   ├── generate-image/     # Image generation endpoint
│   │   ├── edit-image/         # Single image editing endpoint
│   │   ├── download-video/     # Video download endpoint
│   │   ├── process-video/      # Video processing endpoint
│   │   └── analyze-audio/      # Audio analysis endpoint
│   ├── globals.css             # Global styles and animations
│   ├── layout.tsx              # Root layout with providers
│   └── page.tsx                # Main chat interface
├── components/                  # React Components
│   ├── ui/                     # 50+ shadcn/ui components
│   ├── web-search-results.tsx  # Web search display component
│   ├── multi-image-edit-modal.tsx      # Multi-image editor
│   ├── multi-edit-comparison-modal.tsx # Before/after comparison
│   ├── image-edit-modal.tsx    # Single image editor
│   ├── image-comparison-modal.tsx      # Image comparison view
│   ├── settings.tsx            # Settings panel
│   └── notification.tsx        # Toast notifications
├── contexts/                    # React Context Providers
│   ├── chat-sessions-context.tsx # Chat history management
│   ├── images-context.tsx      # Image state management
│   ├── videos-context.tsx      # Video state management
│   ├── audios-context.tsx      # Audio state management
│   └── settings-context.tsx    # Settings state management
├── hooks/                       # Custom React Hooks
│   └── use-local-storage.ts    # Persistent storage hook
├── lib/                         # Utility Functions
│   ├── chat-storage-utils.ts   # Chat storage compression
│   ├── media-storage.ts        # Media file management
│   ├── image-utils.ts          # Image processing
│   └── utils.ts                # General utilities
├── public/                      # Static Assets
│   ├── generated-images/       # AI-generated images
│   └── sample-audio/           # Sample audio files
├── scripts/                     # Setup Scripts
│   └── setup-ytdlp.js          # yt-dlp installation
└── middleware.ts               # Next.js middleware
```

## 🔌 API Endpoints

### POST `/api/chat`
Main chat endpoint with multi-modal support and tool integration.

**Features**:
- Text chat with Gemini AI
- File upload support (images, videos, documents)
- Tool integration (image generation, web search)
- Streaming responses

### POST `/api/search-web`
Web search using Perplexity AI.

**Request Body**:
```json
{
  "query": "latest AI developments",
  "searchMode": "web",
  "return_images": true,
  "return_related_questions": true
}
```

### POST `/api/edit-multi-images`
Edit multiple images simultaneously.

**Request Body**:
```json
{
  "imageUrls": ["url1", "url2", "..."],
  "prompt": "Combine these into a collage"
}
```

### POST `/api/enhance-prompt`
Enhance prompts using AI for better results.

**Request Body**:
```json
{
  "prompt": "make it red",
  "chatHistory": []
}
```

### POST `/api/generate-image`
Generate images using AI models.

**Request Body**:
```json
{
  "prompt": "A futuristic city at sunset",
  "imageGenerationModel": "wavespeed",
  "size": "1024x1024",
  "quality": "high"
}
```

### POST `/api/download-video`
Download videos from URLs.

**Request Body**:
```json
{
  "url": "https://example.com/video.mp4",
  "format": "mp4"
}
```

## 🎨 UI Features

### Web Search Interface
- **Search Progress**: Animated indicators during search
- **Rich Results**: Citations with favicons and domains
- **Image Gallery**: Grid view with lightbox
- **Related Questions**: Click to auto-submit

### Multi-Image Editor
- **Visual Selection**: Checkbox grid interface
- **Batch Operations**: Select/deselect all
- **Preview**: See selected images before editing
- **Progress Tracking**: Real-time editing status

### Chat Interface
- **Message History**: Persistent across sessions
- **File Attachments**: Drag & drop support
- **Tool Integration**: Seamless AI tool usage
- **Responsive Design**: Works on all devices

## ⚙️ Configuration

### Settings Panel
- **AI Model Selection**: Choose between providers
- **Image Models**: OpenAI vs Wavespeed
- **Search Settings**: Configure web search behavior
- **Display Options**: UI customization
- **Storage Management**: Clear cached data

### File Limits
- **Images**: Max 20MB per file
- **Videos**: Max 200MB per file
- **Audio**: Max 50MB per file
- **Batch Operations**: Max 10 images for multi-edit

## 🧪 Testing

### Test Scripts
```bash
# Test basic setup
./test-setup.sh

# Test web search
curl -X POST http://localhost:3000/api/search-web \
  -H "Content-Type: application/json" \
  -d '{"query": "AI news"}'

# Test multi-image edit
./test-multi-image-edit.sh

# Test prompt enhancement
./test-enhance-prompt.sh

# Test all features
./test-comprehensive.sh
```

## 🐛 Troubleshooting

### Common Issues

1. **Web Search Not Working**
   - Verify PERPLEXITY_API_KEY is set correctly
   - Check API quota and billing
   - Test with curl command above

2. **Multi-Image Edit Fails**
   - Ensure WAVESPEED_API_KEY is configured
   - Check image URLs are accessible
   - Verify image count ≤ 10

3. **Storage Issues**
   - Clear browser local storage
   - Check available disk space
   - Use storage management in settings

4. **Video Processing Errors**
   - Verify yt-dlp is installed: `npx yt-dlp --version`
   - Check video URL is accessible
   - Ensure ffmpeg is available for conversions

## 📊 Technology Stack

### Frontend
- **Next.js 15.1.3** - React framework with App Router
- **React 19.0.0** - UI library
- **TypeScript 5.7.3** - Type safety
- **Tailwind CSS 3.4.17** - Utility-first styling
- **Framer Motion 11.15.0** - Animations
- **Radix UI** - Accessible components

### AI Integration
- **Google Gemini AI** - Chat and analysis
- **Perplexity AI** - Web search
- **OpenAI API** - Image generation
- **Wavespeed AI** - Advanced image editing

### Media Processing
- **yt-dlp** - Video downloading
- **FFmpeg** - Media conversion
- **Canvas API** - Image manipulation

## 🔒 Security & Privacy

1. **API Keys**: Stored in environment variables only
2. **Local Storage**: Media files stored client-side
3. **Input Validation**: All inputs sanitized
4. **CORS Protection**: API endpoints secured
5. **Rate Limiting**: Built-in request throttling

## 📈 Performance Optimizations

- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Automatic compression
- **Streaming Responses**: Real-time AI output
- **Local Caching**: Reduced API calls
- **Batch Processing**: Efficient multi-operations

## 🚧 Known Limitations

1. **Browser Storage**: Limited by browser quotas (~50-100MB)
2. **Concurrent Edits**: One multi-image edit at a time
3. **Video Size**: 200MB maximum per file
4. **Search Rate**: Subject to Perplexity API limits

## 📄 Version Information

**Version**: 2.0.0  
**Tag**: `web-search-working-and-multi-edit-image-and-prompt-enhancer`  
**Release Date**: January 2025  
**Compatibility**: Node.js 20+, Modern browsers

## 🤝 Recovery Instructions

To restore this exact version after cloning:

1. Clone the repository
2. Checkout the tag: `git checkout tags/web-search-working-and-multi-edit-image-and-prompt-enhancer`
3. Install dependencies: `npm install`
4. Configure `.env.local` with all API keys
5. Run: `npm run dev`

---

Built with ❤️ using Next.js, AI, and modern web technologies