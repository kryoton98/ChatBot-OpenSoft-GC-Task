const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: { type: String, required: true, enum: ['user', 'model'] },
    content: { type: String, required: true },
    image: { type: String }, // Optional: URL or Base64 (simplified for now)
    timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'New Chat' },
    messages: [messageSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);