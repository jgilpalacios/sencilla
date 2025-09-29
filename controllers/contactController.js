const { Contact } = require('../models');

exports.listContacts = async (req, res) => {
  try {
    const contacts = await Contact.findAll();
    //res.render('contacts', { rows: contacts, title: 'Contactos' });
    res.render('listar', { rows: contacts, title: 'Contactos', elementName: 'contacts', elementNombre: 'Contacto', camposNames: ['name','phone'] });
  } catch (err) {
    console.log('Error en DB:', err.message);
    res.render("error", { message: "Error en DB: " + err.message, title: 'Error' });
  }
};

exports.newContactForm = (req, res) => {
  res.render("new", { title: 'Nuevo Contacto' });
};

exports.createContact = async (req, res) => {
  const { name, phone } = req.body;
  try {
    //await db.insertContact(name, phone);
    await Contact.create({ name, phone });
    res.redirect("/contacts");
  } catch (err) {
    res.render("error", { message: "Error guardando contacto: " + err.message, title: 'Error' });
  }
};

// Editar contacto
exports.editContactForm = async (req, res) => {
  try {
    //const contact = await db.getContact(req.params.id);
    const contacts = await Contact.findAll({ where: { id: req.params.id } });
    const contact = contacts[0];
    if (!contact) return res.render("error", { message: "Contacto no encontrado", title: 'Error' });
    res.render("new", { contact, title: 'Editar Contacto' });
  } catch (err) {
    res.render("error", { message: "Error obteniendo contacto: " + err.message, title: 'Error' });
  }
};

//
exports.updateContact = async (req, res) => {
  const { name, phone } = req.body;
  try {
    await Contact.update({ name, phone }, { where: { id: req.params.id } });
    res.redirect("/contacts");
  } catch (err) {
    res.render("error", { message: "Error actualizando: " + err.message, title: 'Error' });
  }
};

// Eliminar contacto
exports.deleteContact = async (req, res) => {
  try {
    await Contact.destroy({ where: { id: req.params.id } });
    res.redirect("/contacts");
  } catch (err) {
    res.render("error", { message: "Error eliminando: " + err.message, title: 'Error' });
  }
}
