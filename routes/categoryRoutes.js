const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

// Category routes
router.post('/category', categoryController.createCategory);
router.get('/categories', categoryController.getCategories);

// Special Category routes
router.post('/special-category', categoryController.createSpecialCategory);
router.get('/special-categories', categoryController.getSpecialCategories);

module.exports = router;
