import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

export const uploadsDir = join(process.cwd(), 'uploads');

mkdirSync(uploadsDir, { recursive: true });

export const modelFileStorage = diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) =>
    cb(null, `${randomUUID()}${extname(file.originalname)}`),
});
