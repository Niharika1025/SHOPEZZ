import cloudinary from '../config/cloudinary.js';

// Helper function to upload buffer stream to Cloudinary
const uploadStream = (fileBuffer, folder = 'shopez') => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    stream.end(fileBuffer);
  });
};

// @desc    Upload single image
// @route   POST /api/upload/single
// @access  Private (Seller/Admin only)
export const uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Please upload an image file' });
    }

    const result = await uploadStream(req.file.buffer);

    res.status(200).json({
      status: 'success',
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload multiple images (up to 5)
// @route   POST /api/upload/multiple
// @access  Private (Seller/Admin only)
export const uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Please upload image files' });
    }

    const uploadPromises = req.files.map((file) => uploadStream(file.buffer));
    const results = await Promise.all(uploadPromises);

    const uploadedData = results.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id
    }));

    res.status(200).json({
      status: 'success',
      data: uploadedData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload/:publicId
// @access  Private (Seller/Admin only)
export const deleteImage = async (req, res, next) => {
  const publicId = req.params.publicId || req.body.publicId || req.query.publicId;

  try {
    if (!publicId) {
      return res.status(400).json({ status: 'error', message: 'Please provide public ID' });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      return res.status(400).json({ status: 'error', message: 'Failed to delete image or image does not exist' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Image successfully deleted from Cloudinary'
    });
  } catch (error) {
    next(error);
  }
};
