const { supabaseAdmin } = require("../_lib/supabase-admin");
const { requireAdmin, getAdminUserIfAny } = require("../_lib/require-admin");
const { uploadBase64Image } = require("../_lib/upload-base64-image");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method === "GET") {
    const wantsAll = req.query.all === "1";
    let query = supabaseAdmin.from("comments").select("*").order("created_at", { ascending: false });

    if (wantsAll) {
      const user = await requireAdmin(req, res);
      if (!user) return;
    } else {
      query = query.eq("approved", true);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const body = req.body || {};

    // Honeypot: campo invisível pro humano, só bot preenche. Se vier
    // preenchido, respondemos como se tivesse dado certo (não avisa o bot)
    // mas não gravamos nada.
    if (body.hp_field) {
      return res.status(201).json({ ok: true });
    }

    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const role = (body.role || "").trim();
    const message = (body.message || "").trim();

    if (!name || !email || !message) {
      return res.status(400).json({ error: "name, email e message são obrigatórios." });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "E-mail inválido." });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: "Mensagem muito longa (máximo 1000 caracteres)." });
    }

    const adminUser = await getAdminUserIfAny(req);

    let avatarUrl = null;
    try {
      if (body.avatar_data_url) {
        avatarUrl = await uploadBase64Image(body.avatar_data_url, "avatars");
      }
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const insertPayload = {
      name,
      email,
      role: role || null,
      message,
      avatar_url: avatarUrl,
      // Só um admin autenticado pode publicar direto ou marcar como
      // "adicionado por mim". Qualquer submissão pública sempre entra
      // pendente, mesmo que o corpo da requisição tente dizer o contrário.
      approved: adminUser ? !!body.approved : false,
      created_by_admin: !!adminUser,
    };

    const { data, error } = await supabaseAdmin
      .from("comments")
      .insert(insertPayload)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método não permitido." });
};
