const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
//const db = require("./db");
const bcrypt = require("bcrypt");
const { sequelize, User, Contact,createTablesAndDefaultUser } = require('./models');


const app = express();

// Configuración de EJS como motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const expressLayouts = require('express-ejs-layouts');
const { title } = require("process");

//app.use(expressLayouts);
//app.set('layout', 'layout'); // archivo layout.ejs
app.set('view engine', 'ejs');
app.use(expressLayouts); // Habilitar el uso de layouts
app.use(express.static('public')); // Archivos estáticos en la carpeta 'public'




// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "clave_secreta",
    resave: false,
    saveUninitialized: false,
  })
);

// Inicializar tablas y usuario admin
//db.createTablesAndDefaultUser();
createTablesAndDefaultUser();

// Middleware para que la sesión esté disponible en todas las vistas
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Middleware autenticación
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// Rutas
app.get("/", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.redirect("/contacts");
});

// Login
app.get("/login", (req, res) => {
  res.render("login",{ title: 'Login' });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    //const user = await db.getUser(username);
    const users = await User.findAll({ where: { username } });
    if (!users[0]) return res.render("error", { message: "Usuario no encontrado", title: 'Error' });
    const user = users[0];
    console.log('USER',user.username+'\n', user.password+'\n', bcrypt.hashSync(password, 10));
    if (bcrypt.compareSync(password, user.password)) {
      req.session.user = user;
      res.redirect("/contacts");
    } else {
      res.render("error", { message: "Contraseña incorrecta: "+err.message, title: 'Error' });
      //res.send("Contraseña incorrecta");
    }
  } catch (err) {
    res.render("error", { message: "Error en DB:"+err.message, title: 'Error' });
    //res.send("Error en DB: " + err.message);
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// Rutas
const contactRoutes = require('./routes/contact');
const userRoutes = require('./routes/user');
app.use('/contacts', requireLogin, contactRoutes);
app.use('/users', requireLogin, userRoutes);



// Middleware de gestión de errores (después de todas las rutas)
app.use((req, res, next) => {
  //res.status(404).sendFile(__dirname + '/public/404.html'); // Asegúrate de tener un archivo 404.html
  res.status(404).render("error", { message: "ERROR 404Página no encontrada" });
});

// Exportar app para Vercel
module.exports = app;

// Para desarrollo local: levantar servidor
if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Servidor local en http://localhost:3000");
  });
}