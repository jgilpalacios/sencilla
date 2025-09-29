const { User } = require('../models');
const bcrypt = require('bcrypt');



exports.listUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    //res.render('users', { rows: users, title: 'Usuarios' });
    res.render('listar', { rows: users, title: 'Usuarios', elementName: 'users', elementNombre: 'Usuario', camposNames: ['username','password'] });
  } catch (err) {
    console.log('Error en DB:', err.message);
    res.render("error", { message: "Error en DB: " + err.message, title: 'Error' });
  }
};

exports.newUserForm = (req, res) => {
  res.render("userNew", { title: 'Nuevo Usuario' });
};

exports.createUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    //await db.insertContact(name, phone);
    const yaExiste = await User.findAll({ where: { username } });
    if (yaExiste[0]) return res.render("error", { message: "El usuario ya existe", title: 'Error' });
    console.log('Creando usuario', username);
    await User.create({ username, password: bcrypt.hashSync(password, 10) });
    res.redirect("/users");
  } catch (err) {
    res.render("error", { message: "Error guardando usuario: " + err.message, title: 'Error' });
  }
};

// Editar usuario
exports.editUserForm = async (req, res) => {
  try {
    const users = await User.findByPk(req.params.id);
    if (!users) return res.render("error", { message: "Usuario no encontrado", title: 'Error' });
    res.render("userNew", { user: users, title: 'Editar Usuario' });
  } catch (err) {
    res.render("error", { message: "Error obteniendo usuario: " + err.message, title: 'Error' });
  }
};
// Actualizar usuario
exports.updateUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const users = await User.findByPk(req.params.id);
    if (!users) return res.render("error", { message: "Usuario no encontrado", title: 'Error' });
    const yaExiste = await User.findAll({ where: { username } });
    if (yaExiste[0] && yaExiste[0].id != req.params.id) return res.render("error", { message: "El usuario ya existe", title: 'Error' });
    console.log('Actualizando usuario', username);
    await User.update({ username, password: bcrypt.hashSync(password, 10) }, { where: { id: req.params.id } });
    res.redirect("/users");
  } catch (err) {
    res.render("error", { message: "Error actualizando: " + err.message, title: 'Error' });
  }
};
// Eliminar usuario
exports.deleteUser = async (req, res) => {
  try {
    const users = await User.findByPk(req.params.id);
    if (!users) return res.render("error", { message: "Usuario no encontrado", title: 'Error' });
    const allUsers = await User.findAll();
    if (allUsers.length<=1) return res.render("error", { message: "No se puede eliminar el último usuario", title: 'Error' });
    console.log('Eliminando usuario', users.username);
    await User.destroy({ where: { id: req.params.id } });
    res.redirect("/users");
  } catch (err) {
    res.render("error", { message: "Error eliminando: " + err.message, title: 'Error' });
  }
}
