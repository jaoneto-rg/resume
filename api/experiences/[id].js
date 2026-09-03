const { supabaseAdmin } = require("../_lib/supabase-admin");
const { requireAdmin } = require("../_lib/require-admin");

module.exports = async (req, res) => {
  const { id } = req.query;
  const user = await requireAdmin(req, res);
  if (!user) return;

  if (req.method === "PUT") {
    const { title, meta, body, sort_order, published } = req.body || {};

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (meta !== undefined) updates.meta = meta;
    if (body !== undefined) updates.body = body;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (published !== undefined) updates.published = published;

    const { data, error } = await supabaseAdmin
      .from("experiences")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { error } = await supabaseAdmin.from("experiences").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader("Allow", "PUT, DELETE");
  return res.status(405).json({ error: "Método não permitido." });
};
