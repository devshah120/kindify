const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

// Category routes
router.post('/category', categoryController.createCategory);
router.get('/categories', categoryController.getCategories);
router.get('/categories/search', categoryController.searchCategories);
router.delete('/category/:id', categoryController.deleteCategory);

// Special Category routes
router.post('/special-category', categoryController.createSpecialCategory);
router.get('/special-categories', categoryController.getSpecialCategories);
router.get('/special-categories/search', categoryController.searchSpecialCategories);
router.delete('/special-category/:id', categoryController.deleteSpecialCategory);

module.exports = router;
