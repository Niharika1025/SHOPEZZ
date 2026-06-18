import User from '../models/User.js';
import { logActivity } from '../utils/logger.js';

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  const { name, avatar } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;

    const updatedUser = await user.save();

    await logActivity(user._id, 'USER_UPDATE_PROFILE', { name: updatedUser.name }, req.ip);

    res.status(200).json({
      status: 'success',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};
