const { supabaseAdmin } = require("../_lib/supabase-admin");
const { currentCommitEnergy } = require("../_lib/energy");

const COFFEE_DECAY_HOURS = 48; // o empurrão de cada café decai em 48h
const COFFEE_BOOST_PERCENT_PER_REAL = 3; // cada R$1 pago = até +3% de energia (no momento do pagamento)

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const { data: statusRow, error: statusError } = await supabaseAdmin
      .from("dev_status")
      .select("last_commit_at, energy_base")
      .eq("id", 1)
      .single();

    if (statusError) throw statusError;

    const commitEnergy = currentCommitEnergy(statusRow);

    const since = new Date(Date.now() - COFFEE_DECAY_HOURS * 3600000).toISOString();
    const { data: payments } = await supabaseAdmin
      .from("coffee_payments")
      .select("amount_cents, created_at")
      .eq("status", "approved")
      .gte("created_at", since);

    const now = Date.now();
    let coffeeBoost = 0;
    for (const p of payments || []) {
      const hoursAgo = (now - new Date(p.created_at).getTime()) / 3600000;
      const decayFactor = Math.max(0, 1 - hoursAgo / COFFEE_DECAY_HOURS);
      coffeeBoost += (p.amount_cents / 100) * COFFEE_BOOST_PERCENT_PER_REAL * decayFactor;
    }

    const energy = Math.max(0, Math.min(100, Math.round(commitEnergy + coffeeBoost)));

    return res.status(200).json({
      energy,
      lastCommitAt: statusRow?.last_commit_at || null,
      recentCoffees: (payments || []).length,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
