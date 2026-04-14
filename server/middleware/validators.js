import { body, validationResult } from 'express-validator';

export const validateUserCreate = [
  body('name').trim().isLength({ min: 2 }).escape().withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'faculty', 'student']).withMessage('Invalid role'),
  body('roleAttr').optional().trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateUserId = [
  body('id').optional().isMongoId().withMessage('Invalid user ID')
];
