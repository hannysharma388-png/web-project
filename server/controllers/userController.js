import User from '../models/User.js';
import bcrypt from 'bcrypt';

export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ ...req.body, password: hashedPassword });
    await newUser.save();
    const userObj = newUser.toObject();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
