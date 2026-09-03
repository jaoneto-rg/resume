// Cliente Supabase para uso EXCLUSIVO dentro das Serverless Functions.
// Usa a service role key, que ignora RLS — por isso NUNCA deve ser
// importado em código que roda no navegador, nem commitado em texto puro.
// As variáveis abaixo são configuradas no painel da Vercel (Settings > Environment Variables).

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[supabase-admin] Faltam variáveis de ambiente SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

module.exports = { supabaseAdmin };
