const { supabaseAdmin } = require("../_lib/supabase-admin");
const { createPreference } = require("../_lib/mercadopago");

// Valores fixos aceitos, em centavos — R$5 / R$10 / R$20.
// Mantém fixo de propósito: evita gente mandando valor negativo ou
// absurdo direto pela requisição.
const ALLOWED_AMOUNTS_CENTS = [500, 1000, 2000];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { amount_cents } = req.body || {};
  if (!ALLOWED_AMOUNTS_CENTS.includes(amount_cents)) {
    return res.status(400).json({ error: "Valor inválido. Use 500, 1000 ou 2000 (centavos)." });
  }

  const origin = `https://${req.headers.host}`;

  try {
    // Cria a linha como "pending" primeiro — o id dela vira a external_reference
    // que usamos pra casar a notificação do webhook com esse pagamento depois.
    const { data: paymentRow, error: insertError } = await supabaseAdmin
      .from("coffee_payments")
      .insert({ amount_cents, status: "pending", provider: "mercadopago" })
      .select()
      .single();

    if (insertError) throw insertError;

    const preference = await createPreference({
      amountCents: amount_cents,
      externalReference: paymentRow.id,
      successUrl: `${origin}/cafe.html?status=success`,
      failureUrl: `${origin}/cafe.html?status=failure`,
      pendingUrl: `${origin}/cafe.html?status=pending`,
      notificationUrl: `${origin}/api/payments/webhook`,
    });

    return res.status(200).json({ checkout_url: preference.init_point });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
