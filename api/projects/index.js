const { supabaseAdmin } = require("../_lib/supabase-admin");
const { requireAdmin } = require("../_lib/require-admin");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    // Lista pública: só projetos publicados, na ordem definida no admin.
    // Se vier ?all=1 e um token de admin válido, devolve tudo (inclusive rascunhos).
    const wantsAll = req.query.all === "1";
    let query = supabaseAdmin
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true });

    if (wantsAll) {
      const user = await requireAdmin(req, res);
      if (!user) return; // requireAdmin já respondeu o erro
    } else {
      query = query.eq("published", true);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { title, description, image_url, techs, live_url, github_url, sort_order, published } =
      req.body || {};

    if (!title || !description) {
      return res.status(400).json({ error: "title e description são obrigatórios." });
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert({
        title,
        description,
        image_url: image_url || null,
        techs: Array.isArray(techs) ? techs : [],
        live_url: live_url || null,
        github_url: github_url || null,
        sort_order: sort_order ?? 0,
        published: !!published,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método não permitido." });
};
