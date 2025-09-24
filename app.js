// app.js
const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;

// Configurar base de datos SQLite
const db = new sqlite3.Database("./contacts.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT
  )`);

  // Usuario por defecto: admin / 1234
  const hashedPassword = bcrypt.hashSync("1234", 10);
  db.run(
    `INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`,
    ["admin", hashedPassword]
  );
});

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "clave_secreta",
    resave: false,
    saveUninitialized: false,
  })
);

// Middleware de autenticación
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// Rutas
app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.redirect("/contacts");
});

// Login
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views/login.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.send("Error en DB");
    if (!user) return res.send("Usuario no encontrado");

    if (bcrypt.compareSync(password, user.password)) {
      req.session.user = user;
      return res.redirect("/contacts");
    } else {
      res.send("Contraseña incorrecta");
    }
  });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Listar contactos
app.get("/contacts", requireLogin, (req, res) => {
  db.all("SELECT * FROM contacts", [], (err, rows) => {
    if (err) return res.send("Error en DB");

    let html = `<h1>Contactos</h1>
      <a href="/logout">Cerrar sesión</a> |
      <a href="/contacts/new">Nuevo contacto</a>
      <ul>`;
    rows.forEach((c) => {
      html += `<li>${c.name} - ${c.phone} 
        <a href="/contacts/edit/${c.id}">Editar</a> 
        <a href="/contacts/delete/${c.id}">Eliminar</a></li>`;
    });
    html += "</ul>";
    res.send(html);
  });
});

// Formulario nuevo contacto
app.get("/contacts/new", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "views/new.html"));
});

app.post("/contacts/new", requireLogin, (req, res) => {
  const { name, phone } = req.body;
  db.run("INSERT INTO contacts (name, phone) VALUES (?, ?)", [name, phone], (err) => {
    if (err) return res.send("Error guardando contacto");
    res.redirect("/contacts");
  });
});

// Editar contacto
app.get("/contacts/edit/:id", requireLogin, (req, res) => {
  db.get("SELECT * FROM contacts WHERE id = ?", [req.params.id], (err, contact) => {
    if (!contact) return res.send("Contacto no encontrado");
    res.send(`
      <h1>Editar contacto</h1>
      <form method="POST" action="/contacts/edit/${contact.id}">
        <input type="text" name="name" value="${contact.name}" required>
        <input type="text" name="phone" value="${contact.phone}" required>
        <button type="submit">Guardar</button>
      </form>
    `);
  });
});

app.post("/contacts/edit/:id", requireLogin, (req, res) => {
  const { name, phone } = req.body;
  db.run("UPDATE contacts SET name = ?, phone = ? WHERE id = ?", [name, phone, req.params.id], (err) => {
    if (err) return res.send("Error actualizando");
    res.redirect("/contacts");
  });
});

// Eliminar contacto
app.get("/contacts/delete/:id", requireLogin, (req, res) => {
  db.run("DELETE FROM contacts WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.send("Error eliminando");
    res.redirect("/contacts");
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
