const express = require('express');
const router = express.Router();
const userController= require('../controllers/userController');


// Listar usuarios
router.get('/', userController.listUsers);
router.get('/new', userController.newUserForm);
router.post('/new', userController.createUser);

router.get('/edit/:id', userController.editUserForm);
router.post('/edit/:id', userController.updateUser);
router.get('/delete/:id', userController.deleteUser);

module.exports = router;
