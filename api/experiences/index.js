const { supabaseAdmin } = require("../_lib/supabase-admin");
const { requireAdmin } = require("../_lib/require-admin");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    const wantsAll = req.query.all === "1";
    let query = supabaseAdmin
      .from("experiences")
      .select("*")
      .order("sort_order", { ascending: true });

    if (wantsAll) {
      const user = await requireAdmin(req, res);
      if (!user) return;
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

    const { title, meta, body, sort_order, published } = req.body || {};

    if (!title || !meta || !body) {
      return res.status(400).json({ error: "title, meta e body são obrigatórios." });
    }

    const { data, error } = await supabaseAdmin
      .from("experiences")
      .insert({
        title,
        meta,
        body,
        sort_order: sort_order ?? 0,
        published: published !== undefined ? !!published : true,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método não permitido." });
};
