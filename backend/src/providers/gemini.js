
/**
 * @file groq.js
 * @description Integration with gemini model
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const BaseProvider = require('./base')
class GeminiProvider extends BaseProvider {
    constructor() {
        super();
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
    }
    async generateResponse(prompt, imageBuffer, mimeType) {
        try {
            let result;
            if (imageBuffer) {
                const imagePart = {
                    inlineData: {
                        data: imageBuffer.toString("base64"),
                        mimeType: mimeType,
                    },
                };
                result = await this.model.generateContent([prompt, imagePart]);
            } else {
                result = await this.model.generateContent(prompt);
            }
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini API Error:", error);
            throw new Error("Failed to get response from Gemini");
        }
    }
}
module.exports = GeminiProvider;