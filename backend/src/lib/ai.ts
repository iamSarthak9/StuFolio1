import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY || "";
if (apiKey) {
    console.log(`[Groq] Initialized with key: ${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`);
} else {
    console.warn("[Groq] API key is missing!");
}

const groq = new Groq({
    apiKey: apiKey,
});

export const getGroqClient = () => groq;

export async function generateWithRetry(prompt: string, model: string = "llama-3.3-70b-versatile", maxRetries = 3, delay = 2000) {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                model: model,
                response_format: { type: "json_object" },
            });
            
            return completion;
        } catch (error: any) {
            lastError = error;
            // Groq rate limit is usually 429
            if (error.status === 429 || error.message?.includes("rate limit")) {
                console.log(`[Groq] Rate limit hit, retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

// For non-JSON responses (like StuBot)
export async function generateChatResponse(prompt: string, systemPrompt: string, model: string = "llama-3.3-70b-versatile") {
    const completion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
        ],
        model: model,
    });
    return completion.choices[0]?.message?.content || "";
}
