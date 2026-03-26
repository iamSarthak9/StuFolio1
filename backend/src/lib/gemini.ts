import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
if (apiKey) {
    console.log(`[Gemini] Initialized with key: ${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`);
} else {
    console.warn("[Gemini] API key is missing!");
}
const genAI = new GoogleGenerativeAI(apiKey);

export const getGeminiModel = (modelName: string = "gemini-2.0-flash") => {
    return genAI.getGenerativeModel({ model: modelName });
};

export async function generateWithRetry(model: any, prompt: string, maxRetries = 5, delay = 5000) {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await model.generateContent(prompt);
            return result;
        } catch (error: any) {
            lastError = error;
            if (error.message?.includes("429") || error.message?.includes("Too Many Requests")) {
                console.log(`[Gemini] Rate limit hit, retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
                continue;
            }
            throw error; // Rethrow if not a rate limit error
        }
    }
    throw lastError;
}
