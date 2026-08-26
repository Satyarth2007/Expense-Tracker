import {Router} from 'express'
import { register, login, refresh, logout, logoutAll } from '../controllers/authController.js'
import { sendOtp } from '../controllers/otpController.js'
import { requireRefreshAuth } from '../middleware/requireRefreshAuth.js'

const router = Router();

router.post('/register', register)
router.post('/login', login)
router.post('/send-otp', sendOtp)
router.post('/refresh', refresh)
router.post('/logout', requireRefreshAuth, logout)
router.post('/logout-all', requireRefreshAuth, logoutAll)


export default router