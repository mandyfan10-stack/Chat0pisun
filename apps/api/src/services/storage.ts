import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env';
import fs from 'fs/promises';
import path from 'path';

let s3Client: S3Client | null = null;

if (env.s3.enabled && env.s3.accessKeyId && env.s3.secretAccessKey) {
  s3Client = new S3Client({
    region: env.s3.region,
    credentials: {
      accessKeyId: env.s3.accessKeyId,
      secretAccessKey: env.s3.secretAccessKey,
    },
    ...(env.s3.endpoint ? { endpoint: env.s3.endpoint, forcePathStyle: true } : {}),
  });
}

export const uploadFile = async (
  file: Express.Multer.File,
  folder: string,
  filename: string,
): Promise<string> => {
  if (s3Client && env.s3.bucket) {
    const key = `${folder}/${filename}`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.s3.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    if (env.s3.publicUrl) {
      return `${env.s3.publicUrl}/${key}`;
    }

    // Default S3 URL if publicUrl is not set (might need adjustment based on region/provider)
    const baseUrl = env.s3.endpoint || `https://${env.s3.bucket}.s3.${env.s3.region}.amazonaws.com`;
    return `${baseUrl}/${key}`;
  } else {
    // Fallback to local storage
    const uploadDir = path.join(__dirname, '../../uploads', folder);
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, file.buffer);
    
    return `/uploads/${folder}/${filename}`;
  }
};
