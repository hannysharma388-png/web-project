import Notice from '../models/Notice.js';

export const getNotices = async (req, res) => {
  try { res.json(await Notice.find().sort({createdAt: -1})); } catch(err) { res.status(500).json({error: err.message}); }
};

export const createNotice = async (req, res) => {
  try { const notice = new Notice(req.body); await notice.save(); res.status(201).json(notice); } catch(err) { res.status(500).json({error: err.message}); }
};

export const deleteNotice = async (req, res) => {
  try { await Notice.findByIdAndDelete(req.params.id); res.json({msg: 'Deleted'}); } catch(err) { res.status(500).json({error: err.message}); }
};
