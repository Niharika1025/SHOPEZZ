import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logActivity } from '../utils/logger.js';
import { sendWelcomeEmail } from '../utils/email.js';

// Parse cookie value from request headers manually
const getCookie = (req, name) => {
  if (!req.headers.cookie) return null;
  const cookies = req.headers.cookie.split(';');
  for (let cookie of cookies) {
    const trimmed = cookie.trim();
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.substring(0, index);
    if (key === name) {
      return decodeURIComponent(trimmed.substring(index + 1));
    }
  }
  return null;
};

// Generate Access Token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// Set refresh token cookie helper
const sendRefreshTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  res.cookie('refreshToken', token, cookieOptions);
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    // Basic verification
    if (!name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Please provide name, email, and password' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'Email address already registered' });
    }

    // Restrict registration of admin accounts
    if (role === 'admin') {
      return res.status(403).json({ status: 'error', message: 'Self-registration of admin accounts is prohibited' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'buyer'
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    sendRefreshTokenCookie(res, refreshToken);
    
    // Log user registration
    await logActivity(user._id, 'USER_REGISTER', { email: user.email, role: user.role }, req.ip);

    // Send Welcome Email
    sendWelcomeEmail(user.email, user.name);

    res.status(201).json({
      status: 'success',
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
      return res.status(403).json({ status: 'error', message: 'Your account is suspended. Please contact support.' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    sendRefreshTokenCookie(res, refreshToken);

    // Log user login
    await logActivity(user._id, 'USER_LOGIN', { email: user.email }, req.ip);

    res.status(200).json({
      status: 'success',
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    const token = getCookie(req, 'refreshToken');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        await logActivity(decoded.id, 'USER_LOGOUT', {}, req.ip);
      } catch (err) {
        // Ignore verify failure on logout log
      }
    }

    res.cookie('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refresh = async (req, res, next) => {
  const token = getCookie(req, 'refreshToken');

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Session expired. Please log in again.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User session no longer exists' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ status: 'error', message: 'Your account is suspended. Please contact support.' });
    }

    const accessToken = generateAccessToken(user._id);

    res.status(200).json({
      status: 'success',
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Session expired. Please log in again.' });
  }
};
