const express = require('express');
const upload = require('../middlewares/fileUpload');
const rateLimiter = require('../middlewares/rateLimiter');
const { protect } = require('../middlewares/authMiddleware');
const { sendMessage, getAllChats, getChatHistory, deleteChat, stopGeneration } = require('../controllers/chatController');

const router = express.Router();

router.post('/completion', protect, rateLimiter, upload.single('image'), sendMessage);
router.get('/', protect, getAllChats);
router.get('/:id', protect, getChatHistory);
router.delete('/:id', protect, deleteChat);
router.delete('/completion/stop', protect, stopGeneration);

module.exports = router;