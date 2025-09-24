const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./db");

const app = express();

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "clave_secreta",
    resave: false,
    saveUninitialized: false,
  })
);

// Inicializar tablas
db.createTablesAndDefaultUser(bcrypt);

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

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db.getUser(username);
    if (!user) return res.send("Usuario no encontrado");

    if (bcrypt.compareSync(password, user.password)) {
      req.session.user = user;
      return res.redirect("/contacts");
    } else {
      res.send("Contraseña incorrecta");
    }
  } catch (err) {
    res.send("Error en DB: " + err.message);
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Listar contactos
app.get("/contacts", requireLogin, async (req, res) => {
  try {
    const rows = await db.getContacts();
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
  } catch (err) {
    res.send("Error en DB: " + err.message);
  }
});

// Nuevo contacto
app.get("/contacts/new", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "views/new.html"));
});

app.post("/contacts/new", requireLogin, async (req, res) => {
  const { name, phone } = req.body;
  try {
    await db.insertContact(name, phone);
    res.redirect("/contacts");
  } catch (err) {
    res.send("Error guardando contacto: " + err.message);
  }
});

// Editar contacto
app.get("/contacts/edit/:id", requireLogin, async (req, res) => {
  try {
    const contact = await db.getContact(req.params.id);
    if (!contact) return res.send("Contacto no encontrado");
    res.send(`
      <h1>Editar contacto</h1>
      <form method="POST" action="/contacts/edit/${contact.id}">
        <input type="text" name="name" value="${contact.name}" required>
        <input type="text" name="phone" value="${contact.phone}" required>
        <button type="submit">Guardar</button>
      </form>
    `);
  } catch (err) {
    res.send("Error obteniendo contacto: " + err.message);
  }
});

app.post("/contacts/edit/:id", requireLogin, async (req, res) => {
  const { name, phone } = req.body;
  try {
    await db.updateContact(req.params.id, name, phone);
    res.redirect("/contacts");
  } catch (err) {
    res.send("Error actualizando: " + err.message);
  }
});

// Eliminar contacto
app.get("/contacts/delete/:id", requireLogin, async (req, res) => {
  try {
    await db.deleteContact(req.params.id);
    res.redirect("/contacts");
  } catch (err) {
    res.send("Error eliminando: " + err.message);
  }
});

// Exportar app (para Vercel)
module.exports = app;

// Para desarrollo local: levantar server
if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Servidor local en http://localhost:3000");
  });
}
