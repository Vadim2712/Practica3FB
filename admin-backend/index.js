const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const Joi = require('joi');
const app = express();
const port = 8080;

app.use(express.static(path.join(__dirname, '../frontend/admin')));
app.use(cors());
app.use(express.json());

const swaggerDoc = YAML.load('./api-spec.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

const dataPath = path.join(__dirname, '../data/products.json');
let products = require(dataPath);

// Валидация
const productSchema = Joi.object({
  name: Joi.string().min(3).required(),
  price: Joi.number().positive().required(),
  description: Joi.string().min(1).required(),
  category: Joi.array().items(Joi.string()).min(1).required()
});

const saveData = () => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(products, null, 2));
  } catch (err) {
    console.error('Ошибка записи файла:', err);
    throw new Error('Ошибка сохранения данных');
  }
};

// Обработчики API
app.get('/products', (req, res) => {
  res.json(products);
});

app.post('/products', (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) {
      console.error('Ошибка валидации:', error.details);
      return res.status(400).json({ message: error.details[0].message });
    }

    const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct = { id: newId, ...req.body };
    
    products.push(newProduct);
    saveData();
    
    console.log('Товар добавлен:', newProduct);
    res.status(201).json(newProduct);

  } catch (err) {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ message: err.message });
  }
});

app.put('/products/:id', (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const productId = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === productId);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    products[index] = { ...products[index], ...req.body };
    saveData();
    
    res.json(products[index]);

  } catch (err) {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ message: err.message });
  }
});

app.delete('/products/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const initialLength = products.length;
    
    products = products.filter(p => p.id !== productId);
    
    if (products.length === initialLength) {
      return res.status(404).json({ message: 'Товар не найден' });
    }

    saveData();
    res.status(204).send();

  } catch (err) {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ message: err.message });
  }
});

app.listen(port, () => {
  console.log(` Админ-панель запущена: http://localhost:${port}`);
});