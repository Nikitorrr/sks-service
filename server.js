const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Подключение к PostgreSQL (Railway сам задаст DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Создание таблицы при старте (если не существует)
pool.query(`
  CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    equipment VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'новая',
    created_at TIMESTAMP DEFAULT NOW()
  );
`).then(() => console.log('Таблица bookings готова'))
  .catch(err => console.error('Ошибка создания таблицы:', err));

// API: приём заявки
app.post('/api/booking', async (req, res) => {
  const { name, phone, equipment, description } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Имя и телефон обязательны' });
  }

  try {
    await pool.query(
      `INSERT INTO bookings (name, phone, equipment, description, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [name.trim(), phone.trim(), equipment, description?.trim() || '']
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Для админа: просмотр заявок (временно без пароля — для диплома допустимо)
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

// ВСЁ остальное — отдаём index.html (для SPA-поведения)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});