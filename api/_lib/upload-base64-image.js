const { supabaseAdmin } = require("./supabase-admin");

const MAX_BYTES = 2 * 1024 * 1024; // 2MB — mais que suficiente pra uma foto de perfil já comprimida no navegador
const ALLOWED_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// Recebe uma data URL tipo "data:image/jpeg;base64,/9j/4AAQ..." e devolve a
// URL pública depois de subir pro Storage. Lança erro se algo estiver fora
// do esperado (tipo não suportado, arquivo grande demais, etc).
async function uploadBase64Image(dataUrl, folder) {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl || "");
  if (!match) {
    throw new Error("Formato de imagem inválido.");
  }

  const [, contentType, base64Data] = match;
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) {
    throw new Error("Tipo de imagem não suportado. Use JPEG, PNG ou WebP.");
  }

  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.length > MAX_BYTES) {
    throw new Error("Imagem muito grande (máximo 2MB).");
  }

  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from("landing-media")
    .upload(path, buffer, { contentType, upsert: false });

  if (error) throw new Error("Falha no upload da imagem: " + error.message);

  const { data } = supabaseAdmin.storage.from("landing-media").getPublicUrl(path);
  return data.publicUrl;
}

module.exports = { uploadBase64Image };
