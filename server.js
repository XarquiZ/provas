const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Configuração do CORS para permitir requisições do frontend
app.use(cors());
app.use(express.json());

// Conexão com o SQLite
const db = new sqlite3.Database('./provas.db', (err) => {
  if (err) console.error('Erro ao abrir o banco de dados:', err.message);
  else console.log('Conectado ao banco de dados SQLite.');
});

// Criar tabela para armazenar respostas
db.run(`CREATE TABLE IF NOT EXISTS provas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  email TEXT,
  turma TEXT,
  periodo TEXT,
  respostas TEXT,
  nota REAL,
  timestamp TEXT
)`);

// Endpoint para salvar as respostas do aluno
app.post('/api/provas', (req, res) => {
  const { nome, email, turma, periodo, respostas, notaFinal } = req.body;
  const timestamp = new Date().toISOString();
  const stmt = db.prepare(`INSERT INTO provas (nome, email, turma, periodo, respostas, nota, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(nome, email, turma, periodo, JSON.stringify(respostas), notaFinal, timestamp, (err) => {
    if (err) {
      console.error('Erro ao salvar prova:', err.message);
      res.status(500).json({ error: 'Erro ao salvar prova' });
    } else {
      res.status(200).json({ message: 'Prova salva com sucesso' });
    }
  });
  stmt.finalize();
});

// Endpoint para o professor recuperar todas as respostas
app.get('/api/provas', (req, res) => {
  const { turma, periodo } = req.query;
  let query = 'SELECT * FROM provas';
  let params = [];

  if (turma || periodo) {
    query += ' WHERE';
    if (turma) {
      query += ' turma = ?';
      params.push(turma);
    }
    if (periodo) {
      query += (turma ? ' AND' : '') + ' periodo = ?';
      params.push(periodo);
    }
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Erro ao recuperar provas:', err.message);
      res.status(500).json({ error: 'Erro ao recuperar provas' });
    } else {
      res.status(200).json(rows.map(row => ({
        ...row,
        respostas: JSON.parse(row.respostas)
      })));
    }
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});