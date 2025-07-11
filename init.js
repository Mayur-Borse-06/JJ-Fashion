const Product = require("./models/product");
const mongoose = require('mongoose');

main()
.then(() => {
    console.log("MongoDB connected successfully");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/jjfashion');

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}


const sampleProducts = [
  {
    name: "Women's Cotton Saree",
    price: 1299,
    stock: 25,
    sizes: ["L", "XL"],
    description: "Traditional handloom cotton saree for festive occasions.",
    category: "Women",
    images: "https://example.com/saree1.jpg",
    color: ["Red", "Gold"],
    discount: 25
  },
  {
    name: "Men's Formal Shirt",
    price: 899,
    stock: 50,
    sizes: ["M", "L", "XL"],
    description: "Elegant formal shirt perfect for office wear.",
    category: "Men",
    images: "https://example.com/shirt1.jpg",
    color: ["White", "Blue"],
    discount: 10
  },
  {
    name: "Women's Silk Saree",
    price: 1999,
    stock: 15,
    sizes: ["M", "L"],
    description: "Premium silk saree for special occasions.",
    category: "Women",
    images: "https://example.com/saree2.jpg",
    color: ["Pink", "Gold"],
    discount: 30
  },
  {
    name: "Kids Cotton T-Shirt",
    price: 399,
    stock: 100,
    sizes: ["S", "M"],
    description: "Soft cotton t-shirt for kids.",
    category: "Kids",
    images: "https://example.com/kids1.jpg",
    color: ["Red", "Yellow"],
    discount: 15
  },
  {
    name: "Men's Jeans",
    price: 1399,
    stock: 40,
    sizes: ["M", "L", "XL"],
    description: "Stylish denim jeans with comfort fit.",
    category: "Men",
    images: "https://example.com/jeans1.jpg",
    color: ["Blue", "Black"],
    discount: 20
  },
  {
    name: "Women's Casual Kurti",
    price: 699,
    stock: 60,
    sizes: ["S", "M", "L"],
    description: "Casual kurti for everyday use.",
    category: "Women",
    images: "https://example.com/kurti1.jpg",
    color: ["Green", "White"],
    discount: 18
  },
  {
    name: "Men's T-Shirt",
    price: 499,
    stock: 70,
    sizes: ["M", "L", "XL"],
    description: "Comfortable t-shirt for casual wear.",
    category: "Men",
    images: "https://example.com/menTshirt.jpg",
    color: ["Black", "Grey"],
    discount: 12
  },
  {
    name: "Women's Anarkali Dress",
    price: 1799,
    stock: 20,
    sizes: ["L", "XL", "XXL"],
    description: "Elegant Anarkali dress for parties.",
    category: "Women",
    images: "https://example.com/anarkali.jpg",
    color: ["Maroon", "Gold"],
    discount: 22
  },
  {
    name: "Men's Kurta Pajama Set",
    price: 1599,
    stock: 30,
    sizes: ["M", "L", "XL"],
    description: "Traditional kurta pajama for occasions.",
    category: "Men",
    images: "https://example.com/kurtapajama.jpg",
    color: ["Beige", "Gold"],
    discount: 28
  },
  {
    name: "Women's Printed Saree",
    price: 1099,
    stock: 45,
    sizes: ["M", "L", "XL"],
    description: "Beautiful printed saree for daily wear.",
    category: "Women",
    images: "https://example.com/saree3.jpg",
    color: ["Green", "White"],
    discount: 20
  }
];


async function saveToDb() {
    let saved = await Product.insertMany(sampleProducts);
    console.log(saved);
}

saveToDb();
