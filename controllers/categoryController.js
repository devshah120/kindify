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

// Delete
async function deleteCategory(req, res) {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found' 
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      success: true,
      message: 'Category deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}

async function deleteSpecialCategory(req, res) {
  try {
    const specialCategory = await SpecialCategory.findById(req.params.id);
    
    if (!specialCategory) {
      return res.status(404).json({ 
        success: false,
        message: 'Special category not found' 
      });
    }

    await SpecialCategory.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      success: true,
      message: 'Special category deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting special category:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}

// Search categories
async function searchCategories(req, res) {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Search query is required' 
      });
    }

    const searchFilter = {
      name: { $regex: query, $options: 'i' }
    };

    const categories = await Category.find(searchFilter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      query: query,
      count: categories.length,
      categories
    });

  } catch (err) {
    console.error('Error searching categories:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}

// Search special categories
async function searchSpecialCategories(req, res) {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Search query is required' 
      });
    }

    const searchFilter = {
      name: { $regex: query, $options: 'i' }
    };

    const specialCategories = await SpecialCategory.find(searchFilter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      query: query,
      count: specialCategories.length,
      specialCategories
    });

  } catch (err) {
    console.error('Error searching special categories:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}

module.exports = {
  createCategory,
  getCategories,
  deleteCategory,
  searchCategories,
  createSpecialCategory,
  getSpecialCategories,
  deleteSpecialCategory,
  searchSpecialCategories
};
