const { supabaseAdmin } = require("../_lib/supabase-admin");
const { requireAdmin } = require("../_lib/require-admin");
const { uploadBase64Image } = require("../_lib/upload-base64-image");

module.exports = async (req, res) => {
  const { id } = req.query;
  const user = await requireAdmin(req, res);
  if (!user) return;

  if (req.method === "PUT") {
    const { name, email, role, message, approved, avatar_data_url } = req.body || {};

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (message !== undefined) updates.message = message;
    if (approved !== undefined) updates.approved = !!approved;

    if (avatar_data_url) {
      try {
        updates.avatar_url = await uploadBase64Image(avatar_data_url, "avatars");
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    const { data, error } = await supabaseAdmin
      .from("comments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { error } = await supabaseAdmin.from("comments").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader("Allow", "PUT, DELETE");
  return res.status(405).json({ error: "Método não permitido." });
};
