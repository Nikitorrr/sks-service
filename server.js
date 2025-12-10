// server.js
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Подключаем PostgreSQL через DATABASE_URL (Render сам подставит его)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // необходимо для Render + PostgreSQL
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API: получение всех заявок (для проверки)
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении заявок' });
  }
});

// API: создание новой заявки
app.post('/api/booking', express.json(), async (req, res) => {
  const { name, phone, equipment, description } = req.body;

  if (!name || !phone || !equipment) {
    return res.status(400).json({ error: 'Имя, телефон и оборудование обязательны' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bookings (name, phone, equipment, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, phone, equipment, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось сохранить заявку' });
  }
});

// Создание таблицы при старте (если ещё не существует)
const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      equipment VARCHAR(100) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'новая',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  try {
    await pool.query(query);
    console.log('✅ Таблица "bookings" готова');
  } catch (err) {
    console.error('❌ Ошибка создания таблицы:', err);
  }
};

// Запуск
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  createTable();
});
