// Confere se a requisição trouxe um token de sessão válido do Supabase Auth
// E se o e-mail logado é exatamente o seu (definido em ADMIN_EMAIL).
// Uso dentro de uma rota:
//
//   const user = await requireAdmin(req, res);
//   if (!user) return; // requireAdmin já respondeu com 401/403
//
const { supabaseAdmin } = require("./supabase-admin");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function requireAdmin(req, res) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Token de autenticação ausente." });
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    res.status(401).json({ error: "Sessão inválida ou expirada." });
    return null;
  }

  if (!ADMIN_EMAIL || data.user.email !== ADMIN_EMAIL) {
    res.status(403).json({ error: "Usuário não autorizado como admin." });
    return null;
  }

  return data.user;
}

module.exports = { requireAdmin };
