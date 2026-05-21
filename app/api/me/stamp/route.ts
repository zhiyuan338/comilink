import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { authErrorResponse, requireUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DEFAULT_MAX_SIZE_MB = 5;
const STAMP_WIDTH = 600;
const STAMP_HEIGHT = 800;

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
        { error: "Stamp image is required." },
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
          width: STAMP_WIDTH,
          height: STAMP_HEIGHT,
          fit: "cover",
          position: "center",
        })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      return NextResponse.json(
        { error: "Invalid image file." },
        { status: 400 },
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filename = `${user.id}-${randomUUID()}.webp`;
    const uploadPath = path.join(uploadDir, filename);
    const stampImageUrl = `/uploads/${filename}`;

    await mkdir(uploadDir, { recursive: true });
    await writeFile(uploadPath, webpBuffer);

    await prisma.user.update({
      where: { id: user.id },
      data: { stampImageUrl },
    });

    return NextResponse.json({ success: true, stampImageUrl });
  } catch (error) {
    return authErrorResponse(error);
  }
}
