import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const storeFile = path.join(dataDir, 'store.json');
const JWT_SECRET = process.env.JWT_SECRET || 'new-wap-demo-secret';
const PORT = process.env.PORT || 3001;

fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(storeFile)) {
  fs.writeFileSync(storeFile, JSON.stringify({
    users: [
      { id: 'u1', name: 'Leandro Ferrari', email: 'usuario@embarque.com', password: '123456' }
    ],
    days: {}
  }, null, 2));
}

const readStore = () => JSON.parse(fs.readFileSync(storeFile, 'utf8'));
const writeStore = (next) => fs.writeFileSync(storeFile, JSON.stringify(next, null, 2));

app.use(cors());
app.use(express.json());

const authRequired = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;

  if (!token) return res.status(401).json({ message: 'Token missing' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalid' });
  }
};

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.post('/api/login', (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const store = readStore();
  const user = store.users.find((item) => item.email.toLowerCase() === String(email).trim().toLowerCase() && item.password === String(password));

  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

app.get('/api/me', authRequired, (req, res) => {
  const store = readStore();
  const user = store.users.find((item) => item.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/api/days', authRequired, (req, res) => {
  const store = readStore();
  const days = store.days || {};
  res.json({ days });
});

app.put('/api/days/:date', authRequired, (req, res) => {
  const { date } = req.params;
  const store = readStore();
  const payload = req.body || {};
  const next = {
    ...store,
    days: {
      ...(store.days || {}),
      [date]: {
        ...(store.days?.[date] || {}),
        ...payload,
        synced: true
      }
    }
  };

  writeStore(next);
  return res.json({ day: next.days[date] });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
