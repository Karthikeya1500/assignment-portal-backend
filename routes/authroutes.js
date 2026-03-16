const express = require('express');
const router = express.Router();

const { registerUser, loginUser, verifyToken } = require('../controllers/authcontroller');
const { authMiddleware } = require('../middleware/authmiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify', authMiddleware, verifyToken);



module.exports = router;