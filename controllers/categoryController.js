const { Category, SpecialCategory } = require('../models/Category');

// Create
async function createCategory(req, res) {
  const { name, icon } = req.body;
  const category = new Category({ name, icon });
  await category.save();
  res.status(201).json(category);
}

async function createSpecialCategory(req, res) {
  const { name, icon } = req.body;
  const specialCategory = new SpecialCategory({ name, icon });
  await specialCategory.save();
  res.status(201).json(specialCategory);
}

// Get All
async function getCategories(req, res) {
  const categories = await Category.find();
  res.json(categories);
}

async function getSpecialCategories(req, res) {
  const specialCategories = await SpecialCategory.find();
  res.json(specialCategories);
}

module.exports = {
  createCategory,
  getCategories,
  createSpecialCategory,
  getSpecialCategories
};
