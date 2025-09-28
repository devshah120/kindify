const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
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
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number, required: true },
  description: { type: String },
  options: [{
    name: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  selectedAmount: { 
    type: Number, 
    required: true, 
    validate: {
      validator: function(value) {
        return value >= this.minAmount && value <= this.maxAmount;
      },
      message: props => `Selected amount ${props.value} must be between ${this.minAmount} and ${this.maxAmount}`
    }
  }
});

module.exports = mongoose.model('Donation', donationSchema);
