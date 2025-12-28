const express = require('express');
const categoryController = require('../controllers/categoryController');
const auth = require('../middlewares/auth');

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

// Trust Category Configuration routes
router.post('/trust/category/save', auth, categoryController.saveCategoryConfigurations); // Save both Normal and Special together
router.get('/trust/category/configs', auth, categoryController.getTrustCategoryConfigs);
router.get('/trust/category/details', categoryController.getCategoryDetailsByTrust); // Get category details by categoryId, isNormal, and trustId
router.get('/trust/category/config', categoryController.getTrustCategoryConfigByDetails); // Get specific config by categoryType, categoryId, trustId
router.get('/trusts/by-categories', categoryController.getTrustsByCategoryConfigs); // Get trusts list based on category configurations
router.put('/trust/category/normal/:configId', auth, categoryController.updateNormalCategoryConfig); // Update Normal category
router.put('/trust/category/special/:configId', auth, categoryController.updateSpecialCategoryConfig); // Update Special category
router.delete('/trust/category/config/:configId', auth, categoryController.deleteTrustCategoryConfig);
router.patch('/trust/category/config/:configId/status', auth, categoryController.toggleCategoryStatus);

module.exports = router;
