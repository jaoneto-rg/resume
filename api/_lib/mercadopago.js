// Client simples pra API REST do Mercado Pago (Checkout Pro — Preferences API).
// Usa fetch nativo do Node, sem SDK — mantém a dependência do projeto em zero.

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_API = "https://api.mercadopago.com";

async function createPreference({
  amountCents,
  externalReference,
  successUrl,
  failureUrl,
  pendingUrl,
  notificationUrl,
}) {
  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: "Café pro Dev ☕",
          quantity: 1,
          currency_id: "BRL",
          unit_price: amountCents / 100,
        },
      ],
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return: "approved",
      external_reference: externalReference,
      notification_url: notificationUrl,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Falha ao criar preferência no Mercado Pago.");
  }
  return data; // contém init_point (URL de checkout) e id (id da preferência)
}

async function getPayment(paymentId) {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Falha ao buscar pagamento no Mercado Pago.");
  }
  return data; // contém status, external_reference, transaction_amount, etc.
}

module.exports = { createPreference, getPayment };
