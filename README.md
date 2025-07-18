# VEO3 Agent v3 - Complete Setup Guide

## 🚀 Project Overview

VEO3 Agent v3 is an advanced AI chat platform that combines multiple AI services to provide:
- AI-powered chat with Google Gemini
- Web search integration with Perplexity AI
- Image generation and editing capabilities
- Video download from social media platforms
- Audio analysis and processing
- Multi-modal content support

## ✅ Current Working Features

### Fully Working:
- ✅ **AI Chat** - Google Gemini integration with streaming responses
- ✅ **Web Search** - Rich search results with citations and images
- ✅ **Image Generation** - OpenAI and Wavespeed models
- ✅ **Image Editing** - Single and multi-image editing
- ✅ **YouTube Downloads** - Including YouTube Shorts
- ✅ **Facebook Downloads** - Videos and Reels
- ✅ **Audio Processing** - Upload and analyze audio files
- ✅ **Prompt Enhancement** - AI-powered prompt improvement
- ✅ **File Management** - Drag & drop, persistence, and validation

### Known Issues:
- ⚠️ **Video Generation** - May experience API errors from Replicate

## 📋 Prerequisites

- **Node.js** v20.0.0 or higher
- **npm** or **yarn**
- **Git**
- **API Keys** for various services (see below)

## 🔧 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/ajwestfield/veo3-agent-v3.git
cd veo3-agent-v3
```

### 2. Install Dependencies
```bash
npm install
```
This will automatically:
- Install all npm packages
- Download and install yt-dlp binary for video downloads

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# REQUIRED - Chat functionality
GEMINI_API_KEY=your_gemini_api_key_here

# REQUIRED - Web search
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# REQUIRED - Image editing and generation
WAVESPEED_API_KEY=your_wavespeed_api_key_here

# OPTIONAL - Additional image generation
OPENAI_API_KEY=your_openai_api_key_here

# OPTIONAL - Video generation
REPLICATE_API_TOKEN=your_replicate_api_token_here
```

### 4. Getting API Keys

#### Google Gemini (REQUIRED)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API Key"
3. Create a new API key or use existing one
4. Copy and paste into `GEMINI_API_KEY`

#### Perplexity AI (REQUIRED)
1. Sign up at [Perplexity AI](https://www.perplexity.ai/)
2. Go to Settings → API
3. Generate an API key
4. Copy and paste into `PERPLEXITY_API_KEY`

#### Wavespeed (REQUIRED)
1. Sign up at [Wavespeed](https://wavespeed.com/)
2. Navigate to API settings
3. Generate an API key
4. Copy and paste into `WAVESPEED_API_KEY`

#### OpenAI (OPTIONAL)
1. Sign up at [OpenAI](https://platform.openai.com/)
2. Go to API Keys section
3. Create a new secret key
4. Copy and paste into `OPENAI_API_KEY`

#### Replicate (OPTIONAL)
1. Sign up at [Replicate](https://replicate.com/)
2. Go to Account Settings
3. Copy your API token
4. Copy and paste into `REPLICATE_API_TOKEN`

### 5. Run the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 6. Build for Production
```bash
npm run build
npm start
```

## 🎯 Feature Usage Guide

### Video Downloads
- **YouTube**: Paste any YouTube URL (including Shorts) - automatically downloads
- **Facebook**: Paste any Facebook video or Reel URL - automatically downloads
- Videos appear in chat input and sidebar after download

### Image Editing
- **Single Image**: Upload image → Enter edit prompt → See results
- **Multi-Image**: Upload up to 10 images → Select images → Apply edits to all

### Web Search
- Type search query → Get rich results with citations
- Click "People Also Ask" for related queries
- View related images in gallery

### Chat Features
- Supports text, images, videos, audio, and documents
- Streaming responses from Gemini AI
- Persistent chat history across sessions

## 🐛 Troubleshooting

### Common Issues:

1. **"yt-dlp not found" error**
   ```bash
   npm run postinstall
   ```

2. **Video download fails**
   - Check if yt-dlp is updated: `npm update yt-dlp-exec`
   - For YouTube: Ensure video is public
   - For Facebook: Ensure video is public or try different URL format

3. **API errors**
   - Verify all required API keys are set
   - Check API key permissions and quotas
   - Ensure keys are valid and active

4. **Build errors**
   ```bash
   rm -rf node_modules .next
   npm install
   npm run build
   ```

## 📁 Project Structure

```
veo3-agent-v3/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── page.tsx           # Main chat interface
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # UI components (shadcn)
│   └── ...               # Feature components
├── contexts/             # React context providers
├── lib/                  # Utility functions
├── public/               # Static assets
└── test-scripts/         # Testing utilities
```

## 🏷️ Version Tags

- `veo3-working` - Stable working version
- `url-to-video-working` - Video download feature complete

## 📚 Additional Documentation

- `VIDEO_DOWNLOAD_FIX_SUMMARY.md` - Video download implementation details
- `YOUTUBE_SHORTS_FIX.md` - YouTube Shorts support
- `FACEBOOK_VIDEO_REELS_STATUS.md` - Facebook download status
- `VIDEO_URL_DOWNLOAD_FEATURE.md` - Feature documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private. All rights reserved.

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review additional documentation
3. Open an issue on GitHub

---

**Note**: This is a fully working version with all major features functional, including Facebook video downloads.