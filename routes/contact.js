const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');


// Listar contactos
router.get('/', contactController.listContacts);

router.get('/new', contactController.newContactForm);

router.post('/new', contactController.createContact);

router.get('/edit/:id', contactController.editContactForm);

router.post('/edit/:id', contactController.updateContact);

router.get('/delete/:id', contactController.deleteContact);

module.exports = router;