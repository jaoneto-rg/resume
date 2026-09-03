const { supabaseAdmin } = require("../_lib/supabase-admin");
const { requireAdmin } = require("../_lib/require-admin");

module.exports = async (req, res) => {
  const { id } = req.query;
  const user = await requireAdmin(req, res);
  if (!user) return;

  if (req.method === "PUT") {
    const { title, description, image_url, techs, live_url, github_url, sort_order, published } =
      req.body || {};

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (image_url !== undefined) updates.image_url = image_url;
    if (techs !== undefined) updates.techs = techs;
    if (live_url !== undefined) updates.live_url = live_url;
    if (github_url !== undefined) updates.github_url = github_url;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (published !== undefined) updates.published = published;

    const { data, error } = await supabaseAdmin
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { error } = await supabaseAdmin.from("projects").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader("Allow", "PUT, DELETE");
  return res.status(405).json({ error: "Método não permitido." });
};
