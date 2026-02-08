/**
 * @file aiService.js
 * @description Handles logic for switching between Gemini and Groq with correct Model Reporting.
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");
require('dotenv').config();

// Initialize SDKs
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper: Convert File Buffer to GenerativePart (for Gemini)
function fileToGenerativePart(buffer, mimeType) {
    return {
        inlineData: {
            data: buffer.toString("base64"),
            mimeType,
        },
    };
}

/**
 * Generates AI response with Context Memory
 */
exports.generate = async (prompt, fileBuffer, mimeType, modelName = 'gemini', history = []) => {
    
    // --- OPTION 1: GOOGLE GEMINI ---
    if (modelName === 'gemini') {
        try {
            // FIX: Use 1.5-flash (2.5 is not stable/public yet)
            const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
            
            let textResponse = "";

            if (fileBuffer) {
                const imagePart = fileToGenerativePart(fileBuffer, mimeType);
                const result = await model.generateContent([prompt, imagePart]);
                textResponse = result.response.text();
            } else {
                const chat = model.startChat({ history: history });
                const result = await chat.sendMessage(prompt);
                textResponse = result.response.text();
            }

            // CHANGE 1: Return Object, not just string
            return { text: textResponse, model: "gemini" };

        } catch (error) {
            // --- FALLBACK LOGIC ---
            console.warn(`⚠️ Gemini Failed: ${error.message}`);
            console.log("⚡ Recursively switching to Groq...");
            
            // RECURSIVE CALL: This will now return the Groq object ({ text: "...", model: "groq" })
            return await exports.generate(prompt, fileBuffer, mimeType, 'groq', history);
        }
    }

    // --- OPTION 2: GROQ (Llama 3) ---
    else if (modelName === 'groq') {
        
        const messages = history.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.parts[0].text
        }));

        if (fileBuffer) {
            console.log("Using Groq Vision (90b)...");
            const base64Image = fileBuffer.toString("base64");
            
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: prompt || "Analyze this image." },
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
                ]
            });
             
            const chatCompletion = await groq.chat.completions.create({
                messages: messages,
                model: "llama-3.2-90b-vision-preview",
                temperature: 0.5,
                max_tokens: 1024,
            });

            // CHANGE 2: Return Object
            return { 
                text: chatCompletion.choices[0]?.message?.content, 
                model: "groq" 
            };

        } else {
            messages.push({ role: "user", content: prompt });
            
            const chatCompletion = await groq.chat.completions.create({
                messages: messages,
                model: "llama-3.3-70b-versatile", 
                temperature: 0.7,
                max_tokens: 1024,
            });

            // CHANGE 3: Return Object
            return { 
                text: chatCompletion.choices[0]?.message?.content || "No response", 
                model: "groq" 
            };
        }
    }

    else {
        throw new Error("Invalid model selected");
    }
};