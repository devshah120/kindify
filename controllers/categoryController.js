const { Category, SpecialCategory } = require('../models/Category');
const TrustCategoryConfig = require('../models/TrustCategoryConfig');
const User = require('../models/User');

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

// Create Normal Category Configuration
async function createNormalCategoryConfig(req, res) {
  try {
    const { categoryId, donationType, minAmount, maxAmount, quantity, amountPerQty, categoryRemarks } = req.body;
    const trustId = req.user?.id;

    if (!trustId) {
      return res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }

    if (!categoryId) {
      return res.status(400).json({ 
        success: false,
        message: 'Category ID is required' 
      });
    }

    if (!donationType || !['On Price', 'On Quantity'].includes(donationType)) {
      return res.status(400).json({ 
        success: false,
        message: 'Donation type must be "On Price" or "On Quantity"' 
      });
    }

    // Validate based on donation type
    if (donationType === 'On Price') {
      if (minAmount === undefined || maxAmount === undefined) {
        return res.status(400).json({ 
          success: false,
          message: 'minAmount and maxAmount are required for "On Price" donation type' 
        });
      }
      if (minAmount < 0 || maxAmount < 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Amounts must be non-negative' 
        });
      }
      if (maxAmount < minAmount) {
        return res.status(400).json({ 
          success: false,
          message: 'maxAmount must be greater than or equal to minAmount' 
        });
      }
    } else if (donationType === 'On Quantity') {
      if (quantity === undefined || amountPerQty === undefined) {
        return res.status(400).json({ 
          success: false,
          message: 'quantity and amountPerQty are required for "On Quantity" donation type' 
        });
      }
      if (quantity <= 0 || amountPerQty < 0) {
        return res.status(400).json({ 
          success: false,
          message: 'quantity must be greater than 0 and amountPerQty must be non-negative' 
        });
      }
    }

    // Validate categoryRemarks length
    if (categoryRemarks && categoryRemarks.length > 200) {
      return res.status(400).json({ 
        success: false,
        message: 'Category remarks must be 200 characters or less' 
      });
    }

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found' 
      });
    }

    const configData = {
      categoryId,
      trustId,
      type: 'Normal',
      donationType,
      categoryRemarks: categoryRemarks || ''
    };

    if (donationType === 'On Price') {
      configData.minAmount = minAmount;
      configData.maxAmount = maxAmount;
    } else if (donationType === 'On Quantity') {
      configData.quantity = quantity;
      configData.amountPerQty = amountPerQty;
    }

    const config = new TrustCategoryConfig(configData);
    await config.save();

    await config.populate('categoryId', 'name icon');

    res.status(201).json({
      success: true,
      message: 'Normal category configuration saved successfully',
      config
    });
  } catch (err) {
    console.error('Error creating normal category config:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}

// Create Special Category Configuration
async function createSpecialCategoryConfig(req, res) {
  try {
    const { categoryId, donationType, quantity, amountPerQty, supportOptions, categoryRemarks } = req.body;
    const trustId = req.user?.id;

    if (!trustId) {
      return res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }

    if (!categoryId) {
      return res.status(400).json({ 
        success: false,
        message: 'Category ID is required' 
      });
    }

    if (!donationType || !['Menu', 'On Quantity'].includes(donationType)) {
      return res.status(400).json({ 
        success: false,
        message: 'Donation type must be "Menu" or "On Quantity" for Special category' 
      });
    }

    // Validate based on donation type
    if (donationType === 'Menu') {
      if (!supportOptions || !Array.isArray(supportOptions) || supportOptions.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'supportOptions array is required for "Menu" donation type' 
        });
      }
      // Validate each support option
      for (const option of supportOptions) {
        if (!option.name || !option.amount) {
          return res.status(400).json({ 
            success: false,
            message: 'Each support option must have name and amount' 
          });
        }
        if (option.amount < 0) {
          return res.status(400).json({ 
            success: false,
            message: 'Support option amount must be non-negative' 
          });
        }
      }
    } else if (donationType === 'On Quantity') {
      if (quantity === undefined || amountPerQty === undefined) {
        return res.status(400).json({ 
          success: false,
          message: 'quantity and amountPerQty are required for "On Quantity" donation type' 
        });
      }
      if (quantity <= 0 || amountPerQty < 0) {
        return res.status(400).json({ 
          success: false,
          message: 'quantity must be greater than 0 and amountPerQty must be non-negative' 
        });
      }
    }

    // Validate categoryRemarks length
    if (categoryRemarks && categoryRemarks.length > 200) {
      return res.status(400).json({ 
        success: false,
        message: 'Category remarks must be 200 characters or less' 
      });
    }

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found' 
      });
    }

    const configData = {
      categoryId,
      trustId,
      type: 'Special',
      donationType,
      categoryRemarks: categoryRemarks || ''
    };

    if (donationType === 'Menu') {
      configData.supportOptions = supportOptions;
    } else if (donationType === 'On Quantity') {
      configData.quantity = quantity;
      configData.amountPerQty = amountPerQty;
    }

    const config = new TrustCategoryConfig(configData);
    await config.save();

    await config.populate('categoryId', 'name icon');

    res.status(201).json({
      success: true,
      message: 'Special category configuration saved successfully',
      config
    });
  } catch (err) {
    console.error('Error creating special category config:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}

// Get Trust Category Configurations (list with status)
async function getTrustCategoryConfigs(req, res) {
  try {
    const trustId = req.user?.id;
    const { type, status } = req.query; // Optional filters

    if (!trustId) {
      return res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }

    const filter = { trustId };
    if (type && ['Normal', 'Special'].includes(type)) {
      filter.type = type;
    }
    if (status && ['active', 'inactive'].includes(status)) {
      filter.status = status;
    }

    const configs = await TrustCategoryConfig.find(filter)
      .populate('categoryId', 'name icon')
      .sort({ createdAt: -1 });

    const configsList = configs.map(config => ({
      _id: config._id,
      categoryId: config.categoryId,
      categoryName: config.categoryId?.name || null,
      categoryIcon: config.categoryId?.icon || null,
      type: config.type,
      donationType: config.donationType,
      minAmount: config.minAmount || null,
      maxAmount: config.maxAmount || null,
      quantity: config.quantity || null,
      amountPerQty: config.amountPerQty || null,
      supportOptions: config.supportOptions || [],
      categoryRemarks: config.categoryRemarks,
      status: config.status,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    }));

    // Group by category for better organization
    const groupedByCategory = {};
    configsList.forEach(config => {
      const categoryId = config.categoryId?._id?.toString() || 'unknown';
      if (!groupedByCategory[categoryId]) {
        groupedByCategory[categoryId] = {
          categoryId: config.categoryId,
          categoryName: config.categoryName,
          categoryIcon: config.categoryIcon,
          normal: null,
          special: null
        };
      }
      if (config.type === 'Normal') {
        groupedByCategory[categoryId].normal = config;
      } else if (config.type === 'Special') {
        groupedByCategory[categoryId].special = config;
      }
    });

    res.status(200).json({
      success: true,
      totalCount: configsList.length,
      normalCount: configsList.filter(c => c.type === 'Normal').length,
      specialCount: configsList.filter(c => c.type === 'Special').length,
      configs: configsList,
      groupedByCategory: Object.values(groupedByCategory) // Optional: grouped view
    });
  } catch (err) {
    console.error('Error fetching trust category configs:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}

// Save both Normal and Special Category Configurations together
async function saveCategoryConfigurations(req, res) {
  try {
    const { 
      categoryId,
      // Normal category data
      normalDonationType,
      normalMinAmount,
      normalMaxAmount,
      normalQuantity,
      normalAmountPerQty,
      normalCategoryRemarks,
      // Special category data
      specialDonationType,
      specialQuantity,
      specialAmountPerQty,
      specialSupportOptions,
      specialCategoryRemarks
    } = req.body;
    const trustId = req.user?.id;

    if (!trustId) {
      return res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }

    if (!categoryId) {
      return res.status(400).json({ 
        success: false,
        message: 'Category ID is required' 
      });
    }

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found' 
      });
    }

    const results = {
      normal: null,
      special: null
    };

    // Save Normal Category Configuration
    if (normalDonationType) {
      if (!['On Price', 'On Quantity'].includes(normalDonationType)) {
        return res.status(400).json({ 
          success: false,
          message: 'Normal donation type must be "On Price" or "On Quantity"' 
        });
      }

      if (normalDonationType === 'On Price') {
        if (normalMinAmount === undefined || normalMaxAmount === undefined) {
          return res.status(400).json({ 
            success: false,
            message: 'normalMinAmount and normalMaxAmount are required for "On Price" donation type' 
          });
        }
        if (normalMinAmount < 0 || normalMaxAmount < 0 || normalMaxAmount < normalMinAmount) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid amount values for Normal category' 
          });
        }
      } else if (normalDonationType === 'On Quantity') {
        if (normalQuantity === undefined || normalAmountPerQty === undefined) {
          return res.status(400).json({ 
            success: false,
            message: 'normalQuantity and normalAmountPerQty are required for "On Quantity" donation type' 
          });
        }
        if (normalQuantity <= 0 || normalAmountPerQty < 0) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid quantity values for Normal category' 
          });
        }
      }

      if (normalCategoryRemarks && normalCategoryRemarks.length > 200) {
        return res.status(400).json({ 
          success: false,
          message: 'Normal category remarks must be 200 characters or less' 
        });
      }

      const normalConfigData = {
        categoryId,
        trustId,
        type: 'Normal',
        donationType: normalDonationType,
        categoryRemarks: normalCategoryRemarks || ''
      };

      if (normalDonationType === 'On Price') {
        normalConfigData.minAmount = normalMinAmount;
        normalConfigData.maxAmount = normalMaxAmount;
      } else {
        normalConfigData.quantity = normalQuantity;
        normalConfigData.amountPerQty = normalAmountPerQty;
      }

      const normalConfig = new TrustCategoryConfig(normalConfigData);
      await normalConfig.save();
      await normalConfig.populate('categoryId', 'name icon');
      results.normal = normalConfig;
    }

    // Save Special Category Configuration
    if (specialDonationType) {
      if (!['Menu', 'On Quantity'].includes(specialDonationType)) {
        return res.status(400).json({ 
          success: false,
          message: 'Special donation type must be "Menu" or "On Quantity"' 
        });
      }

      if (specialDonationType === 'Menu') {
        if (!specialSupportOptions || !Array.isArray(specialSupportOptions) || specialSupportOptions.length === 0) {
          return res.status(400).json({ 
            success: false,
            message: 'specialSupportOptions array is required for "Menu" donation type' 
          });
        }
        for (const option of specialSupportOptions) {
          if (!option.name || option.amount === undefined) {
            return res.status(400).json({ 
              success: false,
              message: 'Each support option must have name and amount' 
            });
          }
          if (option.amount < 0) {
            return res.status(400).json({ 
              success: false,
              message: 'Support option amount must be non-negative' 
            });
          }
        }
      } else if (specialDonationType === 'On Quantity') {
        if (specialQuantity === undefined || specialAmountPerQty === undefined) {
          return res.status(400).json({ 
            success: false,
            message: 'specialQuantity and specialAmountPerQty are required for "On Quantity" donation type' 
          });
        }
        if (specialQuantity <= 0 || specialAmountPerQty < 0) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid quantity values for Special category' 
          });
        }
      }

      if (specialCategoryRemarks && specialCategoryRemarks.length > 200) {
        return res.status(400).json({ 
          success: false,
          message: 'Special category remarks must be 200 characters or less' 
        });
      }

      const specialConfigData = {
        categoryId,
        trustId,
        type: 'Special',
        donationType: specialDonationType,
        categoryRemarks: specialCategoryRemarks || ''
      };

      if (specialDonationType === 'Menu') {
        specialConfigData.supportOptions = specialSupportOptions;
      } else {
        specialConfigData.quantity = specialQuantity;
        specialConfigData.amountPerQty = specialAmountPerQty;
      }

      const specialConfig = new TrustCategoryConfig(specialConfigData);
      await specialConfig.save();
      await specialConfig.populate('categoryId', 'name icon');
      results.special = specialConfig;
    }

    if (!results.normal && !results.special) {
      return res.status(400).json({ 
        success: false,
        message: 'At least one category configuration (Normal or Special) must be provided' 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Category configurations saved successfully',
      normal: results.normal,
      special: results.special
    });
  } catch (err) {
    console.error('Error saving category configurations:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}

// Update/Edit Normal Category Configuration
async function updateNormalCategoryConfig(req, res) {
  try {
    const { configId } = req.params;
    const {
      donationType,
      minAmount,
      maxAmount,
      quantity,
      amountPerQty,
      categoryRemarks,
      status
    } = req.body;
    const trustId = req.user?.id;

    if (!trustId) {
      return res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }

    const config = await TrustCategoryConfig.findOne({ 
      _id: configId, 
      trustId,
      type: 'Normal'
    });

    if (!config) {
      return res.status(404).json({ 
        success: false,
        message: 'Normal category configuration not found' 
      });
    }

    // Update donation type if provided
    if (donationType) {
      if (!['On Price', 'On Quantity'].includes(donationType)) {
        return res.status(400).json({ 
          success: false,
          message: 'Normal donation type must be "On Price" or "On Quantity"' 
        });
      }
      config.donationType = donationType;
    }

    // Update fields based on donation type
    if (config.donationType === 'On Price') {
      if (minAmount !== undefined) {
        if (minAmount < 0) {
          return res.status(400).json({ 
            success: false,
            message: 'minAmount must be non-negative' 
          });
        }
        config.minAmount = minAmount;
      }
      if (maxAmount !== undefined) {
        if (maxAmount < 0) {
          return res.status(400).json({ 
            success: false,
            message: 'maxAmount must be non-negative' 
          });
        }
        config.maxAmount = maxAmount;
      }
      if (minAmount !== undefined && maxAmount !== undefined && maxAmount < minAmount) {
        return res.status(400).json({ 
          success: false,
          message: 'maxAmount must be greater than or equal to minAmount' 
        });
      }
      // Clear quantity fields if switching to On Price
      config.quantity = undefined;
      config.amountPerQty = undefined;
    } else if (config.donationType === 'On Quantity') {
      if (quantity !== undefined) {
        if (quantity <= 0) {
          return res.status(400).json({ 
            success: false,
            message: 'quantity must be greater than 0' 
          });
        }
        config.quantity = quantity;
      }
      if (amountPerQty !== undefined) {
        if (amountPerQty < 0) {
          return res.status(400).json({ 
            success: false,
            message: 'amountPerQty must be non-negative' 
          });
        }
        config.amountPerQty = amountPerQty;
      }
      // Clear price fields if switching to On Quantity
      config.minAmount = undefined;
      config.maxAmount = undefined;
    }

    // Update category remarks if provided
    if (categoryRemarks !== undefined) {
      if (categoryRemarks.length > 200) {
        return res.status(400).json({ 
          success: false,
          message: 'Category remarks must be 200 characters or less' 
        });
      }
      config.categoryRemarks = categoryRemarks;
    }

    // Update status if provided
    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ 
          success: false,
          message: 'Status must be "active" or "inactive"' 
        });
      }
      config.status = status;
    }

    await config.save();
    await config.populate('categoryId', 'name icon');

    res.status(200).json({
      success: true,
      message: 'Normal category configuration updated successfully',
      config
    });
  } catch (err) {
    console.error('Error updating normal category configuration:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}

// Update/Edit Special Category Configuration
async function updateSpecialCategoryConfig(req, res) {
  try {
    const { configId } = req.params;
    const {
      donationType,
      quantity,
      amountPerQty,
      supportOptions,
      categoryRemarks,
      status
    } = req.body;
    const trustId = req.user?.id;

    if (!trustId) {
      return res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }

    const config = await TrustCategoryConfig.findOne({ 
      _id: configId, 
      trustId,
      type: 'Special'
    });

    if (!config) {
      return res.status(404).json({ 
        success: false,
        message: 'Special category configuration not found' 
      });
    }

    // Update donation type if provided
    if (donationType) {
      if (!['Menu', 'On Quantity'].includes(donationType)) {
        return res.status(400).json({ 
          success: false,
          message: 'Special donation type must be "Menu" or "On Quantity"' 
        });
      }
      config.donationType = donationType;
    }

    // Update fields based on donation type
    if (config.donationType === 'On Quantity') {
      if (quantity !== undefined) {
        if (quantity <= 0) {
          return res.status(400).json({ 
            success: false,
            message: 'quantity must be greater than 0' 
          });
        }
        config.quantity = quantity;
      }
      if (amountPerQty !== undefined) {
        if (amountPerQty < 0) {
          return res.status(400).json({ 
            success: false,
            message: 'amountPerQty must be non-negative' 
          });
        }
        config.amountPerQty = amountPerQty;
      }
      // Clear menu fields if switching to On Quantity
      config.supportOptions = undefined;
    } else if (config.donationType === 'Menu') {
      if (supportOptions !== undefined) {
        if (!Array.isArray(supportOptions) || supportOptions.length === 0) {
          return res.status(400).json({ 
            success: false,
            message: 'supportOptions must be a non-empty array' 
          });
        }
        for (const option of supportOptions) {
          if (!option.name || option.amount === undefined) {
            return res.status(400).json({ 
              success: false,
              message: 'Each support option must have name and amount' 
            });
          }
          if (option.amount < 0) {
            return res.status(400).json({ 
              success: false,
              message: 'Support option amount must be non-negative' 
            });
          }
        }
        config.supportOptions = supportOptions;
      }
      // Clear quantity fields if switching to Menu
      config.quantity = undefined;
      config.amountPerQty = undefined;
    }

    // Update category remarks if provided
    if (categoryRemarks !== undefined) {
      if (categoryRemarks.length > 200) {
        return res.status(400).json({ 
          success: false,
          message: 'Category remarks must be 200 characters or less' 
        });
      }
      config.categoryRemarks = categoryRemarks;
    }

    // Update status if provided
    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ 
          success: false,
          message: 'Status must be "active" or "inactive"' 
        });
      }
      config.status = status;
    }

    await config.save();
    await config.populate('categoryId', 'name icon');

    res.status(200).json({
      success: true,
      message: 'Special category configuration updated successfully',
      config
    });
  } catch (err) {
    console.error('Error updating special category configuration:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}

// Get Trusts List Based on Category Configurations
async function getTrustsByCategoryConfigs(req, res) {
  try {
    const { status, categoryId } = req.query; // Optional filters

    // Build filter for category configurations
    const configFilter = {};
    if (status && ['active', 'inactive'].includes(status)) {
      configFilter.status = status;
    }
    if (categoryId) {
      configFilter.categoryId = categoryId;
    }

    // Get all unique trustIds that have category configurations
    const configs = await TrustCategoryConfig.find(configFilter).select('trustId');
    const uniqueTrustIds = [...new Set(configs.map(config => config.trustId.toString()))];

    if (uniqueTrustIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        trusts: []
      });
    }

    // Get trust details for all unique trustIds
    const trusts = await User.find({
      _id: { $in: uniqueTrustIds },
      role: 'Trust'
    })
      .select('trustName adminName email role profilePhoto designation city state address pincode darpanId createdAt supportedBy')
      .sort({ createdAt: -1 });

    // Get category configuration counts for each trust
    const trustsWithCategoryInfo = await Promise.all(
      trusts.map(async (trust) => {
        const trustConfigs = await TrustCategoryConfig.find({ trustId: trust._id })
          .populate('categoryId', 'name icon')
          .select('type status categoryId');

        const normalConfigs = trustConfigs.filter(c => c.type === 'Normal');
        const specialConfigs = trustConfigs.filter(c => c.type === 'Special');
        const activeConfigs = trustConfigs.filter(c => c.status === 'active');
        const inactiveConfigs = trustConfigs.filter(c => c.status === 'inactive');

        // Get unique categories
        const categories = trustConfigs.map(c => ({
          _id: c.categoryId?._id,
          name: c.categoryId?.name,
          icon: c.categoryId?.icon
        })).filter((cat, index, self) => 
          index === self.findIndex(c => c._id?.toString() === cat._id?.toString())
        );

        return {
          _id: trust._id,
          trustName: trust.trustName,
          adminName: trust.adminName,
          email: trust.email,
          role: trust.role,
          profilePhoto: trust.profilePhoto || null,
          designation: trust.designation || null,
          city: trust.city || null,
          state: trust.state || null,
          address: trust.address || null,
          pincode: trust.pincode || null,
          darpanId: trust.darpanId || null,
          totalSupporters: trust.supportedBy ? trust.supportedBy.length : 0,
          categories: categories,
          categoryStats: {
            totalCategories: categories.length,
            normalCount: normalConfigs.length,
            specialCount: specialConfigs.length,
            activeCount: activeConfigs.length,
            inactiveCount: inactiveConfigs.length
          },
          createdAt: trust.createdAt
        };
      })
    );

    res.status(200).json({
      success: true,
      count: trustsWithCategoryInfo.length,
      trusts: trustsWithCategoryInfo
    });
  } catch (err) {
    console.error('Error fetching trusts by category configs:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}

// Delete Trust Category Configuration
async function deleteTrustCategoryConfig(req, res) {
  try {
    const { configId } = req.params;
    const trustId = req.user?.id;

    if (!trustId) {
      return res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }

    const config = await TrustCategoryConfig.findOne({ 
      _id: configId, 
      trustId 
    });

    if (!config) {
      return res.status(404).json({ 
        success: false,
        message: 'Category configuration not found' 
      });
    }

    await TrustCategoryConfig.findByIdAndDelete(configId);

    res.status(200).json({
      success: true,
      message: 'Category configuration deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting category configuration:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}

// Activate/Deactivate Category Configuration
async function toggleCategoryStatus(req, res) {
  try {
    const { configId } = req.params;
    const { status } = req.body;
    const trustId = req.user?.id;

    if (!trustId) {
      return res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Status must be "active" or "inactive"' 
      });
    }

    const config = await TrustCategoryConfig.findOne({ 
      _id: configId, 
      trustId 
    });

    if (!config) {
      return res.status(404).json({ 
        success: false,
        message: 'Category configuration not found' 
      });
    }

    config.status = status;
    await config.save();

    await config.populate('categoryId', 'name icon');

    res.status(200).json({
      success: true,
      message: `Category configuration ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      config
    });
  } catch (err) {
    console.error('Error toggling category status:', err);
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
  searchSpecialCategories,
  createNormalCategoryConfig,
  createSpecialCategoryConfig,
  saveCategoryConfigurations,
  getTrustCategoryConfigs,
  getTrustsByCategoryConfigs,
  updateNormalCategoryConfig,
  updateSpecialCategoryConfig,
  deleteTrustCategoryConfig,
  toggleCategoryStatus
};
