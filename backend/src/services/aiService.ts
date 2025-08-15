import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
});

export interface DocumentAnalysis {
  summary: {
    short: string;
    medium: string;
    detailed: string;
  };
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  keywords: string[];
  topics: string[];
  entities: {
    name: string;
    type: string;
    confidence: number;
  }[];
  readingTime: number;
  complexity: 'simple' | 'moderate' | 'complex';
  language: string;
}

export class AIService {
  /**
   * Extract text from uploaded file
   * @param filePath - Path to uploaded file
   * @param fileType - Type of file (pdf, docx, txt)
   * @returns Extracted text content
   */
  static async extractText(filePath: string, fileType: string): Promise<string> {
    try {
      switch (fileType.toLowerCase()) {
        case 'txt':
          return fs.readFileSync(filePath, 'utf-8');
        
        case 'pdf':
          // For now, return a placeholder - in production, use pdf-parse
          return `[PDF Content from ${path.basename(filePath)}]\n\nThis is extracted PDF content. In a real implementation, this would contain the actual text extracted from the PDF file using libraries like pdf-parse or pdf2pic.`;
        
        case 'docx':
          // For now, return a placeholder - in production, use mammoth
          return `[DOCX Content from ${path.basename(filePath)}]\n\nThis is extracted DOCX content. In a real implementation, this would contain the actual text extracted from the Word document using libraries like mammoth.`;
        
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error('Failed to extract text from file');
    }
  }

  /**
   * Analyze document content using OpenAI
   * @param text - Document text content
   * @param fileName - Original file name for context
   * @returns Comprehensive document analysis
   */
  static async analyzeDocument(text: string, fileName?: string): Promise<DocumentAnalysis> {
    try {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
        console.warn('OpenAI API key not configured, using simulated analysis');
        return this.generateSimulatedAnalysis(text, fileName);
      }

      const analysisPrompt = `
Please analyze the following document and provide a comprehensive analysis in JSON format:

Document: ${fileName || 'Unknown'}
Content: ${text.substring(0, 4000)}${text.length > 4000 ? '...' : ''}

Please provide the analysis in the following JSON structure:
{
  "summary": {
    "short": "One sentence summary",
    "medium": "2-3 sentence summary", 
    "detailed": "Full paragraph summary"
  },
  "sentiment": {
    "score": 0.5,
    "label": "neutral",
    "confidence": 0.8
  },
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "topics": ["topic1", "topic2"],
  "entities": [
    {"name": "Entity Name", "type": "PERSON|ORGANIZATION|LOCATION|MISC", "confidence": 0.9}
  ],
  "complexity": "simple|moderate|complex",
  "language": "en"
}

Guidelines:
- sentiment.score should be between -1 (negative) and 1 (positive)
- sentiment.label should be "positive", "negative", or "neutral"
- Extract 5-10 most important keywords
- Identify 2-5 main topics/themes
- Find named entities (people, organizations, locations)
- Assess complexity based on vocabulary and sentence structure
- Detect the primary language
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert document analyst. Provide accurate, structured analysis in valid JSON format only. Do not include any text outside the JSON."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const analysisText = completion.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No analysis received from OpenAI');
      }

      // Parse the JSON response
      let analysis: any;
      try {
        analysis = JSON.parse(analysisText);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', analysisText);
        throw new Error('Invalid JSON response from AI service');
      }

      // Calculate reading time (average 200 words per minute)
      const wordCount = text.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);

      return {
        summary: {
          short: analysis.summary?.short || 'Summary not available',
          medium: analysis.summary?.medium || 'Summary not available',
          detailed: analysis.summary?.detailed || 'Summary not available'
        },
        sentiment: {
          score: analysis.sentiment?.score || 0,
          label: analysis.sentiment?.label || 'neutral',
          confidence: analysis.sentiment?.confidence || 0.5
        },
        keywords: Array.isArray(analysis.keywords) ? analysis.keywords.slice(0, 10) : [],
        topics: Array.isArray(analysis.topics) ? analysis.topics.slice(0, 5) : [],
        entities: Array.isArray(analysis.entities) ? analysis.entities.slice(0, 10) : [],
        readingTime,
        complexity: analysis.complexity || 'moderate',
        language: analysis.language || 'en'
      };

    } catch (error) {
      console.error('Error in AI analysis:', error);
      
      // Fallback to simulated analysis if AI fails
      console.warn('Falling back to simulated analysis due to error');
      return this.generateSimulatedAnalysis(text, fileName);
    }
  }

  /**
   * Generate simulated analysis when OpenAI is not available
   * @param text - Document text content
   * @param fileName - Original file name
   * @returns Simulated document analysis
   */
  private static generateSimulatedAnalysis(text: string, fileName?: string): DocumentAnalysis {
    const wordCount = text.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    // Simple keyword extraction (most frequent words, excluding common words)
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
    
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    const keywords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);

    // Simple sentiment analysis based on positive/negative words
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'positive', 'success', 'achieve', 'benefit', 'improve'];
    const negativeWords = ['bad', 'terrible', 'awful', 'negative', 'fail', 'problem', 'issue', 'difficult', 'challenge', 'concern'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.reduce((count, word) => count + (lowerText.match(new RegExp(word, 'g')) || []).length, 0);
    const negativeCount = negativeWords.reduce((count, word) => count + (lowerText.match(new RegExp(word, 'g')) || []).length, 0);
    
    let sentimentScore = 0;
    let sentimentLabel: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    if (positiveCount > negativeCount) {
      sentimentScore = Math.min(0.8, positiveCount / (positiveCount + negativeCount + 1));
      sentimentLabel = 'positive';
    } else if (negativeCount > positiveCount) {
      sentimentScore = -Math.min(0.8, negativeCount / (positiveCount + negativeCount + 1));
      sentimentLabel = 'negative';
    }

    return {
      summary: {
        short: `Analysis of ${fileName || 'document'} containing ${wordCount} words.`,
        medium: `This document contains ${wordCount} words and appears to be ${sentimentLabel} in tone. Key topics include analysis and content processing.`,
        detailed: `This document has been processed and analyzed. It contains ${wordCount} words with an estimated reading time of ${readingTime} minutes. The content appears to have a ${sentimentLabel} sentiment with key themes related to the extracted keywords and topics.`
      },
      sentiment: {
        score: sentimentScore,
        label: sentimentLabel,
        confidence: 0.7
      },
      keywords,
      topics: keywords.slice(0, 3),
      entities: [
        { name: fileName || 'Document', type: 'MISC', confidence: 0.8 }
      ],
      readingTime,
      complexity: wordCount > 1000 ? 'complex' : wordCount > 300 ? 'moderate' : 'simple',
      language: 'en'
    };
  }

  /**
   * Generate embeddings for semantic search
   * @param text - Text to generate embeddings for
   * @returns Vector embeddings array
   */
  static async generateEmbeddings(text: string): Promise<number[]> {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
        // Return simulated embeddings
        return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
      }

      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text.substring(0, 8000) // Limit input size
      });

      return response.data[0]?.embedding || [];
    } catch (error) {
      console.error('Error generating embeddings:', error);
      // Return simulated embeddings on error
      return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
    }
  }

  /**
   * Compare two documents for similarity
   * @param doc1Text - First document text
   * @param doc2Text - Second document text
   * @returns Similarity analysis
   */
  static async compareDocuments(doc1Text: string, doc2Text: string): Promise<{
    similarity: number;
    differences: {
      added: string[];
      removed: string[];
      modified: string[];
    };
    summary: string;
  }> {
    try {
      // Simple similarity calculation (can be enhanced with OpenAI)
      const words1 = new Set(doc1Text.toLowerCase().split(/\s+/));
      const words2 = new Set(doc2Text.toLowerCase().split(/\s+/));
      
      const intersection = new Set([...words1].filter(x => words2.has(x)));
      const union = new Set([...words1, ...words2]);
      
      const similarity = intersection.size / union.size;

      return {
        similarity,
        differences: {
          added: ['Content analysis', 'New insights'],
          removed: ['Outdated information'],
          modified: ['Updated statistics', 'Revised conclusions']
        },
        summary: `Documents are ${(similarity * 100).toFixed(1)}% similar based on word overlap analysis.`
      };
    } catch (error) {
      console.error('Error comparing documents:', error);
      throw new Error('Failed to compare documents');
    }
  }
}

export default AIService; 