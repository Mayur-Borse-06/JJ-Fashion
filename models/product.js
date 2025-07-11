const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  sizes: {
    type: [String],
    enum: ["S", "M", "L", "XL", "XXL"],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  images: {
    type: String,
    required: true,
  },
  color: {
    type: [String],
    default: []
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 90
  }
});

module.exports = mongoose.model("Product", productSchema);
