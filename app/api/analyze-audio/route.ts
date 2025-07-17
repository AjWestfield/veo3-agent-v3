import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Check if we have the API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Convert audio file to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    
    // Use Gemini 2.5 Flash Preview to analyze the audio
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
    
    const prompt = `Analyze this audio file and provide:
1. Full transcription with timestamps (format: [MM:SS] text)
2. Speaker identification if multiple speakers
3. Tone/emotion analysis for each segment (happy, sad, angry, neutral, excited, etc.)
4. Background sounds or music if any
5. Overall summary of the audio content

Please format the response as JSON with the following structure:
{
  "transcription": [
    {
      "timestamp": "[00:00]",
      "speaker": "Speaker 1",
      "text": "transcribed text",
      "tone": "emotion/tone",
      "confidence": 0.95
    }
  ],
  "backgroundSounds": ["description of sounds"],
  "summary": "overall summary",
  "duration": "total duration",
  "language": "detected language"
}`;

    console.log('Audio file details:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    try {
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: audioFile.type || 'audio/mpeg',
            data: base64Audio
          }
        },
        prompt
      ]);

      const response = await result.response;
      const text = response.text();
      console.log('Gemini response received:', text.substring(0, 200) + '...');
    
      // Parse the JSON response
      let analysisResult;
      try {
        // Extract JSON from the response (Gemini might include markdown formatting)
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          // Fallback: try to parse the entire response
          analysisResult = JSON.parse(text);
        }
      } catch (parseError) {
        // If parsing fails, return the raw text with a basic structure
        analysisResult = {
          transcription: [{
            timestamp: "[00:00]",
            speaker: "Unknown",
            text: text,
            tone: "unknown",
            confidence: 0
          }],
          backgroundSounds: [],
          summary: "Unable to parse structured response",
          duration: "unknown",
          language: "unknown",
          rawResponse: text
        };
      }

      return NextResponse.json({
        success: true,
        fileName: audioFile.name,
        fileSize: audioFile.size,
        mimeType: audioFile.type,
        analysis: analysisResult
      });

    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      
      // Check if it's an unsupported media type error
      if (geminiError instanceof Error && geminiError.message.includes('Unsupported MIME type')) {
        return NextResponse.json({
          error: 'Audio format not supported',
          details: 'This audio format may not be supported. Try converting to MP3 or WAV format.'
        }, { status: 415 });
      }
      
      // Check if it's a model not found error
      if (geminiError instanceof Error && geminiError.message.includes('not found')) {
        return NextResponse.json({
          error: 'Model configuration error',
          details: 'The specified Gemini model may not be available. Please check your API access.'
        }, { status: 503 });
      }
      
      throw geminiError;
    }
    
  } catch (error) {
    console.error('Audio analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze audio', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}