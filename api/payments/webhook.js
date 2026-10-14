const crypto = require("crypto");
const { supabaseAdmin } = require("../_lib/supabase-admin");
const { getPayment } = require("../_lib/mercadopago");

const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

// A assinatura do Mercado Pago não depende do corpo bruto inteiro (ao
// contrário da do GitHub) — ela é calculada sobre um "manifesto" com
// campos específicos, então dá pra usar o req.body já parseado normalmente.
function isValidSignature(req, dataId) {
  const signatureHeader = req.headers["x-signature"];
  const requestId = req.headers["x-request-id"];
  if (!signatureHeader || !WEBHOOK_SECRET) return false;

  const parts = {};
  signatureHeader.split(",").forEach((part) => {
    const [key, value] = part.split("=").map((s) => s && s.trim());
    if (key) parts[key] = value;
  });

  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(manifest).digest("hex");

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(v1);
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const dataId = (req.query?.["data.id"] || req.body?.data?.id || "").toString().toLowerCase();

  if (!dataId) return res.status(200).end();

  if (!isValidSignature(req, dataId)) {
    console.warn("[payments/webhook] assinatura inválida, ignorando notificação.");
    // Responde 200 mesmo assim — não queremos que o Mercado Pago fique
    // re-tentando uma notificação forjada/inválida pra sempre.
    return res.status(200).end();
  }

  try {
    const payment = await getPayment(dataId);
    const externalReference = payment.external_reference;
    if (!externalReference) return res.status(200).end();

    await supabaseAdmin
      .from("coffee_payments")
      .update({
        status: payment.status, // approved | pending | rejected | in_process | ...
        provider_payment_id: String(payment.id),
      })
      .eq("id", externalReference);

    return res.status(200).end();
  } catch (err) {
    console.error("[payments/webhook]", err.message);
    // Mesmo em erro nosso, devolve 200 — um 500 aqui faria o Mercado Pago
    // re-tentar indefinidamente a mesma notificação.
    return res.status(200).end();
  }
};
