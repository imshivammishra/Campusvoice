import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomBytes } from 'crypto';
import { JwtAuthGuard } from '../common/guards/auth.guard';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');

const ALLOWED = /\.(jpe?g|png|gif|webp|pdf|docx?|xlsx?|txt)$/i;

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: any, _file: any, cb: any) => {
          if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req: any, file: any, cb: any) => {
          cb(null, randomBytes(12).toString('hex') + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req: any, file: any, cb: any) => {
        if (ALLOWED.test(file.originalname)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only images, PDFs and office documents are allowed',
            ),
            false,
          );
        }
      },
    }),
  )
  upload(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded');
    return {
      url: `/uploads/${file.filename}`,
      name: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
