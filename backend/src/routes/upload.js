import express from 'express';
import upload from '../middleware/upload.js';
import { uploadSingleImage, uploadMultipleImages, deleteImage } from '../controllers/uploadController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('seller', 'admin'));

router.post('/single', upload.single('image'), uploadSingleImage);
router.post('/multiple', upload.array('images', 5), uploadMultipleImages);
router.post('/delete', deleteImage);

export default router;
