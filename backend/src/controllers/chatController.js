/**
 * @file chatController.js
 * @description Handles chat logic, history saving, and context management.
 */
const aiService = require('../services/aiService');
const Chat = require('../models/Chat');

// 1. Send Message & Save History
const sendMessage = async (req, res) => {
    try {
        const { message, model, chatId } = req.body;
        const file = req.file;
        const userId = req.user._id; // Taken from authMiddleware

        // Validation: Must have text OR an image
        if (!message && !file) {
            return res.status(400).json({ error: "Message or image is required" });
        }

        // --- A. Get or Create Chat ---
        let chat;
        if (chatId) {
            chat = await Chat.findOne({ _id: chatId, userId });
        }

        if (!chat) {
            chat = await Chat.create({
                userId,
                title: message ? message.substring(0, 30) + "..." : "Image Chat",
                messages: []
            });
        }

        // --- B. Prepare Global Context (Long Term Memory) ---
        // Find last 3 conversations to give AI context about user identity/preferences
        const previousChats = await Chat.find({
            userId,
            _id: { $ne: chat._id } // Exclude current chat
        })
            .sort({ updatedAt: -1 })
            .limit(3)
            .select('messages');

        let globalContext = "";
        previousChats.forEach(prevChat => {
            const lastMsgs = prevChat.messages.filter(m => m.role === 'user').slice(-2);
            lastMsgs.forEach(m => {
                globalContext += `(In a past chat, User said): ${m.content}\n`;
            });
        });

        // --- C. Prepare Current History (Short Term Memory) ---
        const history = chat.messages.slice(-6).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        let finalPrompt = message;
        if (globalContext) {
            finalPrompt = `[System Note: Context from past chats. Use this if relevant.]\n${globalContext}\n\n[Current Message]: ${message}`;
        }

        // --- D. Process Image ---
        let imageBuffer = null;
        let mimeType = null;
        if (file) {
            imageBuffer = file.buffer;
            mimeType = file.mimetype;
            console.log(`Received image: ${file.originalname} (${mimeType})`);
        }

        // --- E. Call AI Service ---
        // We pass the user's requested model. The Service handles fallback/logic.
        const aiResponseObj = await aiService.generate(finalPrompt, imageBuffer, mimeType, model, history);
        
        // UNPACK THE OBJECT
        const aiResponseText = aiResponseObj.text;
        const usedModel = aiResponseObj.model; // e.g., 'gemini' or 'groq'

        // --- F. Save to Database ---
        chat.messages.push({
            role: 'user',
            content: message || "[Image Upload]",
            image: file ? "Image uploaded" : null
        });

        chat.messages.push({
            role: 'model',
            content: aiResponseText
            // Note: You could add 'model: usedModel' here to schema if you want permanent history of which AI was used
        });

        chat.updatedAt = Date.now();
        await chat.save();

        // --- G. Respond to Frontend ---
        res.status(200).json({
            result: aiResponseText,
            chatId: chat._id,
            title: chat.title,
            modelUsed: usedModel // <--- VITAL: Tells frontend which label to show
        });

    } catch (error) {
        console.error("Controller Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// 2. Get All Chats (For Sidebar)
const getAllChats = async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.user._id })
            .sort({ updatedAt: -1 })
            .select('title updatedAt');
        res.status(200).json(chats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Get Single Chat History
const getChatHistory = async (req, res) => {
    try {
        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
        if (!chat) return res.status(404).json({ error: "Chat not found" });
        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. Delete Chat
const deleteChat = async (req, res) => {
    try {
        await Chat.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.status(200).json({ message: "Chat deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. Stop Generation (Stub)
const stopGeneration = (req, res) => {
    res.status(200).json({ message: "Generation stopped" });
};

module.exports = {
    sendMessage,
    getAllChats,
    getChatHistory,
    deleteChat,
    stopGeneration
};