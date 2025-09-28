const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, required: true },
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
const SpecialCategory = mongoose.model('SpecialCategory', categorySchema);

module.exports = { Category, SpecialCategory };
