import { GoogleGenAI, Type } from "@google/genai";
import type { Question, IncorrectAnswer, Suggestion, QuizConfig, ImprovementSuggestion } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY is not set in your environment variables");
}

const ai = new GoogleGenAI({ apiKey });

/**
 * A higher-order function that adds a retry mechanism with exponential backoff to an API call.
 * This makes the application more resilient to transient server-side errors (e.g., 500, 503).
 * @param apiCall The asynchronous function to call.
 * @param maxRetries The maximum number of retries.
 * @returns The result of the successful API call.
 */
const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let attempt = 0;
  while (true) {
    try {
      return await apiCall();
    } catch (error) {
      attempt++;
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      
      const isTransientError = errorMessage.includes('500') || 
                               errorMessage.includes('503') || 
                               errorMessage.includes('rpc failed') ||
                               errorMessage.includes('network error') ||
                               errorMessage.includes('xhr error');

      if (isTransientError && attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s, 4s...
        console.warn(`Transient API error detected (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`API call failed on attempt ${attempt}.`, error);
        if (isTransientError) {
             throw new Error("The AI service is currently unavailable. Please try again in a few moments.");
        }
        if (error instanceof Error) {
             throw new Error(`An unexpected error occurred while communicating with the AI service. Details: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the AI service.");
      }
    }
  }
};


const quizSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: "The quiz question.",
      },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of 4 possible answers.",
      },
      correctAnswerIndex: {
        type: Type.INTEGER,
        description: "The 0-based index of the correct answer in the 'options' array.",
      },
      explanation: {
        type: Type.STRING,
        description: "A brief explanation of why the correct answer is right."
      },
      sourceHint: {
        type: Type.STRING,
        description: "A brief hint about the key concept or source topic being tested, e.g., 'Concept: Newton's Second Law for Rotation'. This should be concise."
      },
      resourceLink: {
        type: Type.OBJECT,
        description: "An object with a title and URL for a reputable educational resource for further reading.",
        properties: {
            title: {
                type: Type.STRING,
                description: "A descriptive title for the resource link (e.g., 'Khan Academy: Work and Energy')."
            },
            url: {
                type: Type.STRING,
                description: "A valid, full URL to a public, free educational webpage."
            }
        },
      }
    },
    required: ["question", "options", "correctAnswerIndex", "explanation"],
  },
};

const generateQuizPrompt = (config: QuizConfig, incorrectAnswers?: IncorrectAnswer[]): string => {
  let prompt = `Generate a 20-question multiple-choice quiz for a student preparing for the ${config.exam} exam. The subject is ${config.subject}.`;

  if (config.topic === 'Foundational Concepts') {
    prompt += ` The quiz should cover a mix of the most important, foundational, and frequently tested concepts from the entire ${config.subject} syllabus for ${config.exam}.`;
  } else {
     prompt += ` The primary topic is "${config.topic}".`;
  }
  
  prompt += ` The difficulty should be appropriate for ${config.level}.`;


  if (config.mergeTopic) {
    prompt += ` Please also incorporate concepts from the secondary topic "${config.mergeTopic}" to create some multi-concept questions that test the integration of both topics.`;
  }

  prompt += `
- For 'Level 1: Advanced', the questions should be highly challenging, multi-concept, and analytical, similar to those in the JEE Advanced paper.
- For 'Level 2: Mains/NEET', questions should test core concepts with medium difficulty.
- For 'Level 3: Boards', questions should be straightforward and knowledge-based.
- IMPORTANT: For any mathematical equations or symbols, use standard LaTeX formatting. Use $...$ for inline equations (e.g., $E=mc^2$) and $$...$$ for block equations that should appear on their own line.
- For each question, provide a 'sourceHint' string that briefly describes the core concept being tested (e.g., 'Concept: Conservation of Momentum').
- For each question, also provide a 'resourceLink' object containing a 'title' (e.g., "Khan Academy: Intro to Projectile Motion") and a 'url'. The URL must point to a reputable, public, and free-to-access webpage (like a university site, Khan Academy, GeeksforGeeks, Physics Classroom, etc.) where the user can read more about the underlying concept. Do not provide links that are behind a paywall, require a login, or are from dubious sources. The URL must be a full, valid, and working link. Do not invent URLs.
`;

  if (incorrectAnswers && incorrectAnswers.length > 0) {
    const mistakes = incorrectAnswers.map(ans => 
      `- Question: "${ans.question}"\n  My incorrect answer: "${ans.options[ans.userAnswerIndex]}"\n  Correct answer: "${ans.options[ans.correctAnswerIndex]}"`
    ).join('\n');

    prompt += `\nI previously took a quiz on this topic and made these mistakes:\n\n${mistakes}\n\nPlease generate a new, different quiz that specifically targets the concepts I'm struggling with based on these mistakes. The questions should be related but not identical.`;
  }
  
  return prompt;
};

export const generateQuiz = async (config: QuizConfig, incorrectAnswers?: IncorrectAnswer[]): Promise<Question[]> => {
  try {
    const prompt = generateQuizPrompt(config, incorrectAnswers);
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    }));

    const jsonText = response.text.trim();
    const quizData = JSON.parse(jsonText) as Question[];
    
    if (!Array.isArray(quizData) || quizData.length === 0) {
      throw new Error("AI returned an invalid quiz format.");
    }

    return quizData;
  } catch (error) {
    console.error("Error generating quiz:", error);
    // Rethrow the enriched error from withRetry or other processing errors
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("An unknown error occurred while generating the quiz.");
  }
};

const suggestionsSchema = {
    type: Type.OBJECT,
    properties: {
      books: {
        type: Type.ARRAY,
        description: "An array of 2-3 recommended book suggestions.",
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            shortDescription: { type: Type.STRING, description: "A one-sentence description of why this book is helpful for the identified weaknesses." },
          },
          required: ["title", "author", "shortDescription"],
        },
      },
      youtube: {
        type: Type.ARRAY,
        description: "An array of 2-3 recommended YouTube video suggestions.",
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            channel: { type: Type.STRING },
            link: { type: Type.STRING, description: "A valid, full URL to the YouTube video." },
          },
          required: ["title", "channel", "link"],
        },
      },
    },
    required: ["books", "youtube"],
};

const improvementSuggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        topicsToImprove: {
            type: Type.ARRAY,
            description: "A list of specific topics the user should focus on based on their incorrect answers.",
            items: {
                type: Type.OBJECT,
                properties: {
                    topicName: {
                        type: Type.STRING,
                        description: "The specific sub-topic or concept to improve on (e.g., 'Coulomb's Law')."
                    },
                    reason: {
                        type: Type.STRING,
                        description: "A brief, one-sentence explanation of why this topic is being recommended, based on their mistakes."
                    },
                    resourceLink: {
                        type: Type.OBJECT,
                        description: "An object with a title and URL for a reputable educational resource for further reading on this specific topic.",
                        properties: {
                            title: {
                                type: Type.STRING,
                                description: "A descriptive title for the resource link (e.g., 'Khan Academy: Electric Charge and Coulomb's Law')."
                            },
                            url: {
                                type: Type.STRING,
                                description: "A valid, full URL to a public, free educational webpage."
                            }
                        },
                    }
                },
                required: ["topicName", "reason"]
            }
        }
    },
    required: ["topicsToImprove"]
};


const generateSuggestionsPrompt = (config: QuizConfig, incorrectAnswers: IncorrectAnswer[]): string => {
  const mistakes = incorrectAnswers.map(ans =>
    `- Question: "${ans.question}"\n  My incorrect answer: "${ans.options[ans.userAnswerIndex]}"\n  Correct answer: "${ans.options[ans.correctAnswerIndex]}"`
  ).join('\n');

  return `Based on my incorrect answers from a quiz on ${config.subject} (${config.topic}) for the ${config.exam} exam, please recommend some learning resources.

My mistakes were:
${mistakes}

Provide me with:
1.  A list of 2-3 highly relevant and reputable books.
2.  A list of 2-3 specific and helpful YouTube videos (from channels like Khan Academy, Physics Wallah, Unacademy, etc.) that explain the concepts I'm struggling with.

Ensure all links are valid and directly accessible.`;
};

const generateImprovementSuggestionsPrompt = (config: QuizConfig, incorrectAnswers: IncorrectAnswer[]): string => {
    const mistakes = incorrectAnswers.map(ans =>
        `- Question: "${ans.question}" (My incorrect answer was "${ans.options[ans.userAnswerIndex]}")`
    ).join('\n');

    return `I am preparing for the ${config.exam} exam in ${config.subject}. I took a quiz on the topic "${config.topic}" and made the following mistakes:
${mistakes}

Based *only* on these specific mistakes, identify 2-4 granular, specific topics or sub-concepts that I need to improve on. For each topic:
1.  Provide the 'topicName'.
2.  Provide a short 'reason' explaining why I need to focus on it, directly linking it to my errors.
3.  Provide a 'resourceLink' object with a 'title' and a direct, high-quality, free 'url' (like Khan Academy, a university page, GeeksforGeeks, etc.) to a resource that explains that specific concept. Do not invent URLs.`;
};


export const generateSuggestions = async (config: QuizConfig, incorrectAnswers: IncorrectAnswer[]): Promise<Suggestion> => {
    try {
        const prompt = generateSuggestionsPrompt(config, incorrectAnswers);
        const response = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: suggestionsSchema,
            },
        }));

        const jsonText = response.text.trim();
        const suggestionsData = JSON.parse(jsonText) as Suggestion;
        
        if (!suggestionsData || !suggestionsData.books || !suggestionsData.youtube) {
             throw new Error("AI returned an invalid suggestion format.");
        }
        
        return suggestionsData;
    } catch (error) {
        console.error("Error generating suggestions:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unknown error occurred while fetching learning suggestions.");
    }
};

export const generateImprovementSuggestions = async (config: QuizConfig, incorrectAnswers: IncorrectAnswer[]): Promise<ImprovementSuggestion> => {
    try {
        const prompt = generateImprovementSuggestionsPrompt(config, incorrectAnswers);
        const response = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: improvementSuggestionsSchema,
            },
        }));

        const jsonText = response.text.trim();
        const improvementData = JSON.parse(jsonText) as ImprovementSuggestion;
        
        if (!improvementData || !improvementData.topicsToImprove) {
            throw new Error("AI returned an invalid improvement topics format.");
        }

        return improvementData;
    } catch (error) {
        console.error("Error generating improvement suggestions:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unknown error occurred while fetching improvement topics.");
    }
};