import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ContentGenerationRequest {
  platform: string;
  contentType: string;
  tagline: string;
  includeHashtags?: boolean;
  includeFOMO?: boolean;
  tone?: string;
}

export interface GeneratedContent {
  caption: string;
  hashtags: string[];
  imagePrompt?: string;
}

export async function generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const systemPrompt = `You are an expert social media content creator specializing in ${request.platform}. 
  Generate engaging content that follows platform best practices and drives high engagement.
  
  Platform: ${request.platform}
  Content Type: ${request.contentType}
  ${request.tone ? `Tone: ${request.tone}` : ''}
  ${request.includeFOMO ? 'Include FOMO/left-out undertones to create urgency.' : ''}
  
  Respond with JSON in this exact format:
  {
    "caption": "engaging caption text",
    "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
    "imagePrompt": "detailed image generation prompt if needed"
  }`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nTagline: ${request.tagline}` }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const content = JSON.parse(text);
    
    return {
      caption: content.caption || "",
      hashtags: content.hashtags || [],
      imagePrompt: content.imagePrompt,
    };
  } catch (error) {
    console.error("Gemini content generation error:", error);
    throw new Error(`Failed to generate content: ${error}`);
  }
}

export interface SentimentAnalysis {
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  confidence: number;
}

export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const systemPrompt = `Analyze the sentiment of the given text. 
  Respond with JSON in this exact format:
  {
    "sentiment": "positive|negative|neutral",
    "score": number between -1 and 1,
    "confidence": number between 0 and 1
  }`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nText: ${text}` }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const response = await result.response;
    const responseText = response.text();
    
    if (!responseText) {
      throw new Error("Empty response from Gemini");
    }

    const analysis = JSON.parse(responseText);
    
    return {
      sentiment: analysis.sentiment || "neutral",
      score: analysis.score || 0,
      confidence: analysis.confidence || 0,
    };
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    throw new Error(`Failed to analyze sentiment: ${error}`);
  }
}

export async function generateWeeklySummary(metrics: any[]): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Generate a comprehensive weekly summary based on the following social media metrics:
  
  ${JSON.stringify(metrics, null, 2)}
  
  Include:
  - Key performance highlights
  - Areas for improvement
  - Trending content insights
  - Recommendations for next week
  
  Write in a professional but engaging tone, suitable for a marketing dashboard.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Unable to generate summary at this time.";
  } catch (error) {
    console.error("Weekly summary generation error:", error);
    throw new Error(`Failed to generate weekly summary: ${error}`);
  }
}

export async function generateImageFromPrompt(prompt: string): Promise<string | null> {
  // Note: This would typically use a different service like DALL-E or Stable Diffusion
  // For now, we'll return a placeholder or use Gemini's experimental image generation if available
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
    });

    // This is a placeholder - actual image generation would require a specialized model
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Create a detailed image description for: ${prompt}` }] }],
    });

    const response = await result.response;
    const description = response.text();
    
    // Return a placeholder image URL or description for now
    // In production, this would call an actual image generation API
    return description || null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}
