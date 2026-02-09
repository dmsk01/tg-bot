import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { generationController } from '../controllers/generation.controller.js';
import {
  validateTelegramInitData,
  authenticateUser,
} from '../middlewares/validate-telegram.middleware.js';
import { generationRateLimiter } from '../middlewares/generation-rate-limit.middleware.js';
import { configService } from '../../common/config/config.service.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, configService.storage.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: configService.storage.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.'));
    }
  },
});

router.use(validateTelegramInitData);
router.use(authenticateUser);

router.post('/upload', upload.single('image'), (req, res) =>
  generationController.upload(req, res)
);
router.post('/create', generationRateLimiter, (req, res) =>
  generationController.create(req, res)
);
router.get('/history', (req, res) => generationController.getHistory(req, res));
router.get('/:id', (req, res) => generationController.getStatus(req, res));
router.delete('/:id', (req, res) => generationController.delete(req, res));

export default router;
