const crypto = require("crypto");
const { supabaseAdmin } = require("../_lib/supabase-admin");
const { energyAfterPush } = require("../_lib/energy");

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

  // IMPORTANTE: body parsing desabilitado (ver handler.config no final) —
  // precisamos dos bytes exatos que o GitHub enviou pra validar a assinatura.
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

  const commitCount = Array.isArray(payload.commits) ? payload.commits.length : 0;

  const { data: row, error: readError } = await supabaseAdmin
    .from("dev_status")
    .select("last_commit_at, energy_base")
    .eq("id", 1)
    .single();

  if (readError) return res.status(500).json({ error: readError.message });

  const newEnergy = energyAfterPush(row, commitCount);

  const { error } = await supabaseAdmin
    .from("dev_status")
    .update({ energy_base: newEnergy, last_commit_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true, energy: newEnergy });
}

// Desliga o parsing automático do corpo só pra ESSA rota (necessário pra
// validar a assinatura HMAC sobre o corpo bruto).
handler.config = { api: { bodyParser: false } };

module.exports = handler;
