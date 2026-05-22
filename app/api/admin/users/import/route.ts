import { NextResponse } from "next/server";
import { authErrorResponse, requireAdmin } from "@/app/lib/auth";
import { getStringField, readJson } from "@/app/lib/http";
import { hashPassword } from "@/app/lib/password";
import { prisma } from "@/app/lib/prisma";
import { generateUniqueUserToken } from "@/app/lib/user-token";

export const runtime = "nodejs";

type CsvRow = {
  lineNumber: number;
  qq: string;
  username: string;
  password: string;
};

type ImportError = {
  line: number;
  message: string;
};

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current.trim());

  return values;
}

function isHeaderRow(values: string[]) {
  return (
    values[0]?.toLowerCase() === "qq" &&
    values[1]?.toLowerCase() === "username"
  );
}

function parseCsv(csv: string) {
  const rows: CsvRow[] = [];
  const errors: ImportError[] = [];
  const seenQq = new Set<string>();
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/);

  for (const [lineIndex, line] of lines.entries()) {
    if (!line.trim()) {
      continue;
    }

    const values = parseCsvLine(line);
    const lineNumber = lineIndex + 1;

    if (rows.length === 0 && errors.length === 0 && isHeaderRow(values)) {
      continue;
    }

    const qq = values[0]?.trim() || "";
    const username = values[1]?.trim() || "";
    const password = values[2]?.trim() || qq;

    if (!qq || !username) {
      errors.push({
        line: lineNumber,
        message: "QQ and username are required.",
      });
      continue;
    }

    if (!/^\d{5,20}$/.test(qq)) {
      errors.push({
        line: lineNumber,
        message: "QQ must be 5 to 20 digits.",
      });
      continue;
    }

    if (username.length > 50) {
      errors.push({
        line: lineNumber,
        message: "Username is too long.",
      });
      continue;
    }

    if (password.length < 1 || password.length > 128) {
      errors.push({
        line: lineNumber,
        message: "Password must be 1 to 128 characters.",
      });
      continue;
    }

    if (seenQq.has(qq)) {
      errors.push({
        line: lineNumber,
        message: "Duplicate QQ in CSV.",
      });
      continue;
    }

    seenQq.add(qq);
    rows.push({ lineNumber, qq, username, password });
  }

  return { rows, errors };
}

async function readCsvInput(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await readJson(request);
    return getStringField(body, "csv", { trim: false });
  }

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const csv = formData.get("csv");
    const file = formData.get("file");

    if (typeof csv === "string") {
      return csv;
    }

    if (file instanceof File) {
      return file.text();
    }

    return null;
  }

  return request.text();
}

async function createUniqueUserToken() {
  return generateUniqueUserToken(async (token) => {
    const existingUser = await prisma.user.findUnique({
      where: { token },
      select: { id: true },
    });

    return Boolean(existingUser);
  });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const csv = await readCsvInput(request);

    if (!csv?.trim()) {
      return NextResponse.json(
        { success: false, message: "CSV is required." },
        { status: 400 },
      );
    }

    const parsed = parseCsv(csv);
    let created = 0;
    let skipped = parsed.errors.length;
    const errors = [...parsed.errors];

    for (const row of parsed.rows) {
      const existingUser = await prisma.user.findUnique({
        where: { qq: row.qq },
        select: { id: true },
      });

      if (existingUser) {
        skipped += 1;
        continue;
      }

      try {
        await prisma.user.create({
          data: {
            qq: row.qq,
            username: row.username,
            passwordHash: await hashPassword(row.password),
            token: await createUniqueUserToken(),
          },
        });
        created += 1;
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          skipped += 1;
          continue;
        }

        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import complete. Created ${created}, skipped ${skipped}.`,
      created,
      skipped,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
