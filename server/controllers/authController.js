import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const loginUser = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    let user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials or role mismatch.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
       const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
       return res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, course: user.roleAttr } });
    }
    return res.status(401).json({ message: 'Invalid credentials or role mismatch.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
