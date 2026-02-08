const express = require('express');

// 👇 CRITICAL: Make sure 'googleLogin' is imported here!
const { register, login, refreshToken, googleLogin } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// 👇 CRITICAL: You must have this line, or the server ignores the request!
router.post('/google', googleLogin);

module.exports = router;