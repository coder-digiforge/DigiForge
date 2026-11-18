import sharp from "sharp";

const MAX_BYTES = 12 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function safeName(name: string) {
  return name.replace(/[^\w.\-()\sа-яА-ЯёЁ]+/gi, "_").slice(0, 120);
}

function isImage(mime?: string, name?: string) {
  if (mime && IMAGE_TYPES.has(mime)) return true;
  return Boolean(name && /\.(jpe?g|png|webp|gif)$/i.test(name));
}

async function compressImage(buf: Buffer, maxEdge: number) {
  const out = await sharp(buf)
    .rotate()
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  return { buf: out, mime: "image/webp" as const };
}

async function saveUpload(
  file: File,
  options: { imagesOnly?: boolean; maxEdge?: number } = {},
) {
  if (!file || file.size <= 0) return null;
  if (file.size > MAX_BYTES) {
    throw new Error("Файл слишком большой (макс. 12 МБ)");
  }
  if (options.imagesOnly && file.type && !IMAGE_TYPES.has(file.type)) {
    throw new Error("Нужна картинка: JPG, PNG, WebP или GIF");
  }

  const original = safeName(file.name || "file");
  let buf = Buffer.from(await file.arrayBuffer());
  let mime = file.type || "application/octet-stream";

  if (isImage(mime, file.name)) {
    const compressed = await compressImage(buf, options.maxEdge ?? 1600);
    buf = Buffer.from(compressed.buf);
    mime = compressed.mime;
  } else if (buf.length > 2 * 1024 * 1024) {
    throw new Error("Не-изображение больше 2 МБ пока не поддерживается на хостинге");
  }

  const url = `data:${mime};base64,${buf.toString("base64")}`;

  return {
    name: file.name || original,
    url,
    mime,
    size: buf.length,
  };
}

export async function saveChatUpload(file: File) {
  return saveUpload(file, { maxEdge: 1600 });
}

export async function savePortfolioCover(file: File) {
  return saveUpload(file, { imagesOnly: true, maxEdge: 1600 });
}

export async function saveAvatarUpload(file: File) {
  return saveUpload(file, { imagesOnly: true, maxEdge: 512 });
}
