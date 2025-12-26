const mongoose = require('mongoose');

const trustCategoryConfigSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  trustId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Normal', 'Special'],
    required: true
  },
  donationType: {
    type: String,
    enum: ['On Price', 'On Quantity', 'Menu'],
    required: true
  },
  // For "On Price" donation type
  minAmount: {
    type: Number,
    required: function() {
      return this.donationType === 'On Price';
    }
  },
  maxAmount: {
    type: Number,
    required: function() {
      return this.donationType === 'On Price';
    }
  },
  // For "On Quantity" donation type (can use single quantity/amountPerQty OR supportOptions for multiple tiers)
  // Validation is handled in controller to allow flexibility
  quantity: {
    type: Number,
    required: false
  },
  amountPerQty: {
    type: Number,
    required: false
  },
  // For "Menu" donation type (Special category) OR "On Quantity" with multiple tiers
  supportOptions: [{
    name: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  categoryRemarks: {
    type: String,
    maxlength: 200,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

// Pre-save hook to clean up fields based on donation type
trustCategoryConfigSchema.pre('save', function(next) {
  // If donationType is "On Quantity" or "Menu" and supportOptions is provided, clear quantity/amountPerQty
  if ((this.donationType === 'On Quantity' || this.donationType === 'Menu') && 
      this.supportOptions && this.supportOptions.length > 0) {
    this.quantity = undefined;
    this.amountPerQty = undefined;
  }
  // If donationType is "On Quantity" or "Menu" and quantity/amountPerQty is provided, clear supportOptions
  else if ((this.donationType === 'On Quantity' || this.donationType === 'Menu') && 
           (this.quantity !== undefined || this.amountPerQty !== undefined)) {
    this.supportOptions = undefined;
  }
  // If donationType is "On Price", clear quantity/amountPerQty and supportOptions
  else if (this.donationType === 'On Price') {
    this.quantity = undefined;
    this.amountPerQty = undefined;
    this.supportOptions = undefined;
  }
  next();
});

module.exports = mongoose.model('TrustCategoryConfig', trustCategoryConfigSchema);

