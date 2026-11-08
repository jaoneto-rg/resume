// Regras da energia do Dev. Ajuste os números aqui, os dois endpoints
// (stats e github-webhook) usam este arquivo.
//
// Modelo acumulativo:
//  - cada push na branch principal SOMA energia (BOOST_PER_COMMIT por commit,
//    com teto de MAX_BOOST_PER_PUSH por push);
//  - a cada 24h completas sem nenhum push, a energia PERDE DECAY_PER_DAY pontos;
//  - a energia fica sempre entre 0 e 100.

const BOOST_PER_COMMIT = 3;
const MAX_BOOST_PER_PUSH = 10;
const DECAY_PER_DAY = 5;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Energia "de commits" neste exato momento, já com o desgaste dos dias
// sem push. `row` vem da tabela dev_status (energy_base + last_commit_at).
function currentCommitEnergy(row, now = Date.now()) {
  if (!row || !row.last_commit_at) return 0;
  const base = Number(row.energy_base) || 0;
  const last = new Date(row.last_commit_at).getTime();
  const fullDaysWithoutPush = Math.max(0, Math.floor((now - last) / 86400000));
  return clamp(base - fullDaysWithoutPush * DECAY_PER_DAY, 0, 100);
}

// Novo valor base depois de um push com `commitCount` commits.
function energyAfterPush(row, commitCount, now = Date.now()) {
  const boost = Math.min(MAX_BOOST_PER_PUSH, BOOST_PER_COMMIT * Math.max(1, commitCount));
  return clamp(currentCommitEnergy(row, now) + boost, 0, 100);
}

module.exports = {
  BOOST_PER_COMMIT,
  MAX_BOOST_PER_PUSH,
  DECAY_PER_DAY,
  currentCommitEnergy,
  energyAfterPush,
};
