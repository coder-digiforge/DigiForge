import { promises as fs } from "fs";
import path from "path";

const MAX_BYTES = 12 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function safeName(name: string) {
  return name.replace(/[^\w.\-()\sа-яА-ЯёЁ]+/gi, "_").slice(0, 120);
}

async function saveUpload(
  file: File,
  folder: "chat" | "portfolio" | "avatars",
  imagesOnly = false,
) {
  if (!file || file.size <= 0) return null;
  if (file.size > MAX_BYTES) {
    throw new Error("Файл слишком большой (макс. 12 МБ)");
  }
  if (imagesOnly && file.type && !IMAGE_TYPES.has(file.type)) {
    throw new Error("Нужна картинка: JPG, PNG, WebP или GIF");
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dir, { recursive: true });
  const id = crypto.randomUUID().slice(0, 8);
  const original = safeName(file.name || "file");
  const stored = `${id}-${original}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, stored), buf);

  return {
    name: file.name || original,
    url: `/uploads/${folder}/${stored}`,
    mime: file.type || undefined,
    size: file.size,
  };
}

export async function saveChatUpload(file: File) {
  return saveUpload(file, "chat");
}

export async function savePortfolioCover(file: File) {
  return saveUpload(file, "portfolio", true);
}

export async function saveAvatarUpload(file: File) {
  return saveUpload(file, "avatars", true);
}
