import express from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

export default router;
