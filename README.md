# VEO3 Agent v1 - AI-Powered Chat with Image Generation and Editing

> A comprehensive AI chat application with advanced image generation and editing capabilities, built with Next.js 15, React 19, and integrated with Google Gemini AI, OpenAI, and Wavespeed APIs.

## 🚀 Features

### Core Capabilities
- **AI Chat Interface**: Modern chat UI with Google Gemini AI integration
- **Image Generation**: Create images using OpenAI DALL-E or Wavespeed AI models
- **Image Editing**: Edit existing images with natural language prompts using Wavespeed Flux Kontext Max
- **Video Processing**: Upload and analyze video files with AI
- **File Upload Support**: Handle images, videos, audio, and documents
- **Real-time Streaming**: Stream AI responses for better user experience
- **Dark Theme**: Beautiful dark-themed interface with smooth animations

### Advanced Features
- **Aspect Ratio Preservation**: Maintains original image dimensions during editing
- **Image Comparison**: Side-by-side comparison of original and edited images
- **Multiple AI Models**: Toggle between different AI providers
- **Settings Panel**: Customize AI behavior and image generation parameters
- **Loading Animations**: Professional placeholder animations during processing
- **Mobile Responsive**: Fully responsive design for all devices

## 📋 Prerequisites

- **Node.js**: v20.0.0 or higher (tested with v20.19.3)
- **npm**: v10.0.0 or higher
- **Git**: For cloning the repository
- **API Keys**: Required for AI services (see Environment Setup)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ajwestfield/veo3-agent-v1.git
cd veo3-agent-v1
```

### 2. Checkout the Working Version

```bash
git checkout tags/image-generation-and-editing-working -b stable-version
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API Key (for DALL-E image generation)
OPENAI_API_KEY=your_openai_api_key_here

# Wavespeed API Key (for advanced image generation and editing)
WAVESPEED_API_KEY=your_wavespeed_api_key_here
```

#### 🔐 Secure API Key Access using Desktop Commander MCP

For enhanced security, you can use the desktop-commander MCP tool to access API keys from the original project without exposing them:

1. Ensure you have desktop-commander MCP installed
2. Navigate to the original veo3-agent project on your desktop
3. Use the MCP to read the `.env.local` file securely
4. Copy the API keys to your new project's `.env.local`

**Note**: Never commit your `.env.local` file to version control.

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
veo3-agent-v1/
├── app/                      # Next.js 15 App Router
│   ├── api/                  # API Routes
│   │   ├── chat/            # Main chat endpoint with Gemini AI
│   │   ├── generate-image/  # Image generation endpoint
│   │   ├── edit-image/      # Image editing endpoint
│   │   ├── process-video/   # Video processing endpoint
│   │   └── test-gemini/     # API testing endpoint
│   ├── globals.css          # Global styles and animations
│   ├── layout.tsx           # Root layout with providers
│   └── page.tsx             # Main chat interface
├── components/              # React Components
│   ├── ui/                  # 50+ shadcn/ui components
│   ├── image-edit-modal.tsx # Image editing interface
│   ├── image-comparison-modal.tsx # Before/after comparison
│   ├── image-processing-placeholder.tsx # Loading animations
│   ├── notification.tsx     # Toast notifications
│   └── settings.tsx         # Settings panel
├── contexts/                # React Context Providers
│   ├── images-context.tsx   # Image state management
│   └── settings-context.tsx # Settings state management
├── lib/                     # Utility Functions
│   ├── utils.ts            # General utilities
│   └── image-utils.ts      # Image processing utilities
├── public/                  # Static Assets
│   └── generated-images/    # Generated images storage
├── test-*.sh               # Test Scripts
└── middleware.ts           # Next.js middleware for uploads
```

## 🔌 API Endpoints

### POST `/api/chat`
Main chat endpoint with multi-modal support.

**Features**:
- Text chat with Gemini AI
- File upload support (images, videos, documents)
- Tool integration (image generation)
- Streaming responses

**Request** (FormData):
- `message`: User message
- `files[]`: Optional file uploads
- `selectedTool`: Optional tool selection
- `imageGenerationSettings`: Settings for image generation

### POST `/api/generate-image`
Generate images using AI models.

**Request Body**:
```json
{
  "prompt": "A beautiful sunset over mountains",
  "imageGenerationModel": "wavespeed", // or "openai"
  "size": "1024x1024",
  "quality": "high",
  "style": "vivid"
}
```

### POST `/api/edit-image`
Edit existing images with natural language.

**Request Body**:
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "prompt": "Make it look like a painting",
  "size": "1024x1024" // Optional, for aspect ratio preservation
}
```

### POST `/api/process-video`
Process video files for analysis.

**Request Body**:
```json
{
  "url": "https://example.com/video.mp4"
}
```

## 🧪 Test Scripts

The project includes comprehensive test scripts:

```bash
# Test basic setup
./test-setup.sh

# Test Gemini API connection
./test-gemini.sh

# Test image generation
./test-image-generation.sh

# Test image editing
./test-edit-image-size.sh

# Test aspect ratio preservation
./test-aspect-ratio.sh

# Test animations
./test-animation-placeholders.sh

# Test video processing
./test-video-upload.sh

# Test streaming responses
./test-streaming.sh
```

## 🎨 UI Components

### Key Components
- **Chat Interface**: Main conversation view with message history
- **Settings Panel**: Configure AI models and parameters
- **Image Edit Modal**: Interface for editing images with prompts
- **Image Comparison Modal**: Compare original and edited images
- **Loading Placeholders**: Beautiful animations during processing

### Component Library
Built with **shadcn/ui** components:
- 50+ reusable components
- Radix UI primitives
- Tailwind CSS styling
- Full accessibility support

## ⚙️ Configuration

### Settings Available
- **AI Model Selection**: Choose between AI providers
- **Image Generation Model**: OpenAI or Wavespeed
- **Image Size**: Various aspect ratios
- **Quality Settings**: Low, Medium, High
- **Style Options**: Vivid or Natural
- **Safety Settings**: Content filtering levels

### Customization
All settings are persisted locally and can be accessed through the settings panel.

## 🐛 Troubleshooting

### Common Issues

1. **Webpack Module Errors**
   ```bash
   rm -rf .next node_modules/.cache
   npm run dev
   ```

2. **API Key Issues**
   - Ensure all API keys are correctly set in `.env.local`
   - Check API key permissions and quotas
   - Verify billing is enabled for paid APIs

3. **Build Errors**
   - Clear Next.js cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

4. **File Upload Limits**
   - Video files: Max 200MB
   - Images: Max 20MB
   - Timeout: 5 minutes for large files

## 📊 Technology Stack

### Frontend
- **Next.js 15.4.1** - React framework with App Router
- **React 19.0.0** - UI library
- **TypeScript 5.7.3** - Type safety
- **Tailwind CSS 3.4.17** - Utility-first styling
- **Framer Motion** - Animations
- **Radix UI** - Headless components

### AI Integration
- **Google Gemini AI** - Chat and multi-modal AI
- **OpenAI API** - DALL-E image generation
- **Wavespeed AI** - Advanced image generation and editing

### State Management
- React Context API for global state
- Local storage for settings persistence

## 🔒 Security Notes

1. **API Keys**: Never commit API keys to version control
2. **File Uploads**: Files are validated and size-limited
3. **CORS**: API endpoints are protected
4. **Input Validation**: All user inputs are sanitized

## 📄 License

This project is a snapshot of the veo3-agent application at the point where image generation and editing features are fully functional.

## 🤝 Contributing

This is a versioned snapshot. For the latest development, please refer to the main repository.

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review test scripts for examples
3. Examine the codebase documentation

---

**Version**: 1.0.0  
**Tag**: `image-generation-and-editing-working`  
**Last Updated**: December 2024

Built with ❤️ using Next.js and AI