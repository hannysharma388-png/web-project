import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';

const generateAccessToken = (user) => {
  if (!user) throw new Error('Cannot generate token: user object is null');
  return jwt.sign(
    { id: user._id, role: user.role, roleAttr: user.roleAttr }, 
    process.env.JWT_SECRET || 'secret', 
    { expiresIn: '15m' }
  );
};

export const loginUser = async (req, res) => {
  const { email, password, role, rememberMe } = req.body;
  try {
    let user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials or role mismatch.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials or role mismatch.' });
    }

    const token = generateAccessToken(user);
    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    
    const days = rememberMe ? 30 : 1;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    await RefreshToken.create({
      token: refreshTokenString,
      user: user._id,
      expiresAt,
    });

    res.cookie('refreshToken', refreshTokenString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: days * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role, course: user.roleAttr } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const existingToken = await RefreshToken.findOne({ token: refreshToken }).populate('user');
    if (!existingToken) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    if (existingToken.expiresAt < new Date()) {
      await RefreshToken.findByIdAndDelete(existingToken._id);
      res.clearCookie('refreshToken');
      return res.status(403).json({ error: 'Refresh token expired' });
    }

    if (!existingToken.user) {
      await RefreshToken.findByIdAndDelete(existingToken._id);
      res.clearCookie('refreshToken');
      return res.status(403).json({ error: 'User associated with this token no longer exists' });
    }

    const newAccessToken = generateAccessToken(existingToken.user);
    res.status(200).json({ token: newAccessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const logoutUser = async (req, res) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    await RefreshToken.findOneAndDelete({ token: refreshToken });
  }
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
};
