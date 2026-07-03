const path = require('path');
const express = require('express');
const db = require('./db');

const app = express();
const port = Number(process.env.PORT || 3000);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.render('login', {
    title: 'Вход',
    error: '',
    login: '',
  });
});

app.post('/login', asyncHandler(async (req, res) => {
  const login = String(req.body.login || '').trim();
  const password = String(req.body.password || '');

  const user = await findUser(login, password);

  if (!user) {
    res.status(401).render('login', {
      title: 'Вход',
      error: 'Неверный логин или пароль',
      login,
    });
    return;
  }

  const products = await getProducts();

  res.render('products', {
    title: 'Торты',
    user,
    products,
  });
}));

app.use((req, res) => {
  res.redirect('/');
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).render('login', {
    title: 'Вход',
    error: 'Не удалось подключиться к базе данных',
    login: req.body?.login || '',
  });
});

async function findUser(login, password) {
  const { rows } = await db.query(
    `
      SELECT
        u.user_id,
        u.full_name,
        u.login,
        r.name AS role_name
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE u.login = $1 AND u.password = $2
      LIMIT 1
    `,
    [login, password],
  );

  return rows[0] || null;
}

async function getProducts() {
  const { rows } = await db.query(`
    SELECT
      p.product_id,
      p.article,
      p.name,
      p.price,
      p.discount_percent,
      p.stock_quantity,
      un.name AS unit_name,
      c.name AS confectionery_name,
      ct.name AS cake_type_name
    FROM products p
    JOIN units un ON un.unit_id = p.unit_id
    JOIN confectioneries c ON c.confectionery_id = p.confectionery_id
    JOIN cake_types ct ON ct.cake_type_id = p.cake_type_id
    ORDER BY p.product_id
  `);

  return rows;
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
