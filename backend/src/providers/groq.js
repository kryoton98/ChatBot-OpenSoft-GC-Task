/**
 * @file groq.js
 * @description Integration with Groq's high-speed inference API.
 */

const Groq = require("groq-sdk");
const BaseProvider = require("./base");

class GroqProvider extends BaseProvider {
    constructor() {
        super();
        // 1. Initialize Groq with the key
        this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        // 2. Use Llama 3 (It is fast and smart)
        this.modelName = "llama-3.3-70b-versatile";
    }

    /**
     * Generate response using Groq
     */
    async generateResponse(prompt, imageBuffer, mimeType) {
        try {
            // Groq currently handles text best. 
            // If there is an image, we might need a specific vision model, 
            // but for now, let's focus on text capability.

            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                model: this.modelName,
            });

            // Extract the text answer
            return completion.choices[0]?.message?.content || "";

        } catch (error) {
            console.error("Groq API Error:", error);
            throw new Error("Failed to get response from Groq");
        }
    }
}

module.exports = GroqProvider;