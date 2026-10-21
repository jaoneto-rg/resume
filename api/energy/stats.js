const { supabaseAdmin } = require("../_lib/supabase-admin");

const COMMIT_DECAY_HOURS = 48; // energia "base" por commit chega a 0 depois de 48h sem commit
const COFFEE_DECAY_HOURS = 48; // o empurrão de cada café também decai em 48h
const COFFEE_BOOST_PERCENT_PER_REAL = 1; // cada R$1 pago = até +1% de energia (no momento do pagamento)

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const { data: statusRow } = await supabaseAdmin
      .from("dev_status")
      .select("last_commit_at")
      .eq("id", 1)
      .single();

    const lastCommitAt = statusRow?.last_commit_at ? new Date(statusRow.last_commit_at) : null;
    const hoursSinceCommit = lastCommitAt
      ? (Date.now() - lastCommitAt.getTime()) / 3600000
      : COMMIT_DECAY_HOURS;
    const commitEnergy = Math.max(0, 100 - (hoursSinceCommit / COMMIT_DECAY_HOURS) * 100);

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
