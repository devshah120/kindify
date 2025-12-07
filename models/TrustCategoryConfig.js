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
  // For "On Quantity" donation type
  quantity: {
    type: Number,
    required: function() {
      return this.donationType === 'On Quantity';
    }
  },
  amountPerQty: {
    type: Number,
    required: function() {
      return this.donationType === 'On Quantity';
    }
  },
  // For "Menu" donation type (Special category)
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
    default: 'inactive'
  }
}, { timestamps: true });

module.exports = mongoose.model('TrustCategoryConfig', trustCategoryConfigSchema);

