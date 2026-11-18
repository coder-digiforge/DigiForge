const MAX_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function safeName(name: string) {
  return name.replace(/[^\w.\-()\sа-яА-ЯёЁ]+/gi, "_").slice(0, 120);
}

async function saveUpload(file: File, imagesOnly = false) {
  if (!file || file.size <= 0) return null;
  if (file.size > MAX_BYTES) {
    throw new Error("Файл слишком большой (макс. 2 МБ)");
  }
  if (imagesOnly && file.type && !IMAGE_TYPES.has(file.type)) {
    throw new Error("Нужна картинка: JPG, PNG, WebP или GIF");
  }

  const original = safeName(file.name || "file");
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "application/octet-stream";
  const url = `data:${mime};base64,${buf.toString("base64")}`;

  return {
    name: file.name || original,
    url,
    mime,
    size: file.size,
  };
}

export async function saveChatUpload(file: File) {
  return saveUpload(file);
}

export async function savePortfolioCover(file: File) {
  return saveUpload(file, true);
}

export async function saveAvatarUpload(file: File) {
  return saveUpload(file, true);
}
