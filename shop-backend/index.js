const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '../frontend/shop'))); 

app.use(cors());
const dataPath = path.join(__dirname, '../data/products.json');

app.get('/products', (req, res) => {
  fs.readFile(dataPath, 'utf8', (err, data) => {
    err ? res.status(500).send('Ошибка сервера') : res.json(JSON.parse(data));
  });
});

app.listen(port, () => {
  console.log(` Магазин запущен: http://localhost:${port}`);
});