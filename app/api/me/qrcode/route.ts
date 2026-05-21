import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { authErrorResponse, requireUser } from "@/app/lib/auth";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DEFAULT_MAX_SIZE_MB = 5;
const QR_CODE_SIZE = 600;

function getUploadMaxBytes() {
  const maxSizeMb = Number(process.env.UPLOAD_MAX_SIZE_MB || DEFAULT_MAX_SIZE_MB);

  return maxSizeMb * 1024 * 1024;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "QR code image is required." },
        { status: 400 },
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only jpg, png, and webp images are supported." },
        { status: 400 },
      );
    }

    if (file.size > getUploadMaxBytes()) {
      return NextResponse.json(
        { error: "Image is too large." },
        { status: 400 },
      );
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    let webpBuffer: Buffer;

    try {
      webpBuffer = await sharp(inputBuffer)
        .rotate()
        .resize({
          width: QR_CODE_SIZE,
          height: QR_CODE_SIZE,
          fit: "cover",
          position: "center",
        })
        .webp({ quality: 88 })
        .toBuffer();
    } catch {
      return NextResponse.json(
        { error: "Invalid image file." },
        { status: 400 },
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filename = `${user.id}-qrcode-${randomUUID()}.webp`;
    const uploadPath = path.join(uploadDir, filename);
    const imageUrl = `/uploads/${filename}`;

    await mkdir(uploadDir, { recursive: true });
    await writeFile(uploadPath, webpBuffer);

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    return authErrorResponse(error);
  }
}
