const crypto = require("crypto");
const { supabaseAdmin } = require("../_lib/supabase-admin");

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function isValidSignature(rawBody, signatureHeader) {
  if (!signatureHeader || !GITHUB_WEBHOOK_SECRET) return false;
  const expected =
    "sha256=" + crypto.createHmac("sha256", GITHUB_WEBHOOK_SECRET).update(rawBody).digest("hex");

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  // IMPORTANTE: body parsing desabilitado (ver module.exports.config no
  // final do arquivo) — precisamos dos bytes exatos que o GitHub enviou
  // pra validar a assinatura HMAC corretamente.
  const rawBody = await readRawBody(req);
  const signature = req.headers["x-hub-signature-256"];

  if (!isValidSignature(rawBody, signature)) {
    return res.status(401).json({ error: "Assinatura inválida." });
  }

  const event = req.headers["x-github-event"];
  if (event !== "push") {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const payload = JSON.parse(rawBody.toString("utf8"));
  const ref = payload.ref; // ex: "refs/heads/master"

  if (ref !== "refs/heads/master" && ref !== "refs/heads/main") {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const { error } = await supabaseAdmin
    .from("dev_status")
    .update({ last_commit_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true });
}

// Desliga o parsing automático do corpo só pra ESSA rota — necessário pra
// validação de assinatura HMAC funcionar (ver readRawBody acima).
handler.config = { api: { bodyParser: false } };

module.exports = handler;
