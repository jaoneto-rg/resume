// Servidor de desenvolvimento local — substitui "vercel dev" que tem bug no Windows.
// Uso: node dev-server.js   (abre em http://localhost:3000)

require("dotenv").config({ path: ".env.local" });

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- middleware ----------
app.use(express.json({ limit: "5mb" }));

// ---------- API routes ----------
// Mapeia as rotas como a Vercel faria com a pasta /api.

// projects
const projectsIndex = require("./api/projects/index");
const projectsById = require("./api/projects/[id]");

app.all("/api/projects", (req, res) => projectsIndex(req, res));
app.all("/api/projects/:id", (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  projectsById(req, res);
});

// experiences
const experiencesIndex = require("./api/experiences/index");
const experiencesById = require("./api/experiences/[id]");

app.all("/api/experiences", (req, res) => experiencesIndex(req, res));
app.all("/api/experiences/:id", (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  experiencesById(req, res);
});

// comments
const commentsIndex = require("./api/comments/index");
const commentsById = require("./api/comments/[id]");

app.all("/api/comments", (req, res) => commentsIndex(req, res));
app.all("/api/comments/:id", (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  commentsById(req, res);
});

// ---------- static files ----------
app.use(express.static(path.join(__dirname)));

// ---------- start ----------
app.listen(PORT, () => {
  console.log(`\n  Dev server rodando em http://localhost:${PORT}`);
  console.log(`  Admin: http://localhost:${PORT}/admin/admin.html\n`);

  // Checagem rápida das variáveis de ambiente
  const ok = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!ok) {
    console.warn(
      "  ⚠  SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas no .env.local!"
    );
    console.warn(
      "     As chamadas da API vão falhar. Preencha o .env.local com os valores reais.\n"
    );
  }
});
