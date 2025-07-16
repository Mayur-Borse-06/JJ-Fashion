const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/product');
const Customer = require('./models/customer');
const Order = require('./models/order')
const session = require('express-session');
const passport = require('passport');
const LocalStratergy = require('passport-local');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const { nextTick } = require('process');

const port = process.env.PORT || 3000;

require('dotenv').config(); 

app.engine('ejs', ejsMate);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({extended: true}));

app.use(methodOverride('_method'));

app.use(session({
  secret: 'anyrandomsecret', // isse secure rakhna .env mein later
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 2,
    httpOnly: true,
    secure: false,
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStratergy({usernameField: 'email' }, Customer.authenticate()));

passport.serializeUser(Customer.serializeUser());
passport.deserializeUser(Customer.deserializeUser());

main()
.then(() => console.log("MongoDB connected successfully"))
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.DB_URL);

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}


app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
})

// Custom middlewares

const isAdmin = (req, res, next) => {
  if(req.isAuthenticated() && req.user.isAdmin) {
    return next();
  } else {
    res.status(401).send("Unauthorized access");
  }
}

//Home page

app.get("/", async(req, res) => {
    let products = await Product.find({});
    res.render("index.ejs", {products});
})

//Customer Login

app.get("/customer/login", (req, res) => {
  res.render("login.ejs");
})

app.post("/customer/login", passport.authenticate("local", {
  failureRedirect: "/customer/login",
}), (req, res) => {
  if(req.user.isAdmin) {
    res.redirect("/admin/products");
  } else {
    res.redirect("/");
  }
})

app.get("/customer/logout", (req, res) => {
  req.logOut((err) => {
    if(err) {
      return next(err);
    } else {
      res.redirect("/");
    }
  })
})

//Customer Signup

app.get("/customer/signup", (req, res) => {
  res.render("signup.ejs");
})

app.post("/customer/signup", async(req, res) => {
  const {name, email, address, password} = req.body;
  const user = new Customer({name, email, address});
  const regCustomer = await Customer.register(user, password);

  req.logIn(regCustomer, (err) => {
    if(err) {
      return res.status(500).send("Error occured after registration");
    }
  });
  res.redirect("/");
})

// Indivdual product show page

app.get("/product/:id", async(req, res) => {
  let {id} = req.params;
  const product = await Product.findById(id);

  //Related products
  const relProducts = await Product.find({category: product.category, _id: {$ne: id}});

  res.render("product.ejs", { product, relProducts });
})

// Orders save

app.post("/product/:id/buy", async(req, res) => {
  let {id: prodId} = req.params;
  const product = await Product.findById(prodId);
  const customer = await Customer.findById(req.user._id)
  
  const newOrder = new Order( {
    product: product._id,
    customer: customer._id,
    quantity: req.body.quantity,
    totalAmount: product.price * req.body.quantity,
  })

  await newOrder.save();
  res.redirect("/");
})

// Orders Show

app.get("/orders", async(req, res) => {
  const orders = await Order.find({customer: req.user._id}).populate("product");
  res.render("customerOrders.ejs", { orders })
})

// Cart

app.post("/cart/:id/add", async(req, res) => {
  const {id} = req.params;
  const quantity = parseInt(req.body.quantity);

  if(!req.session.cart) {
    req.session.cart = [];
  }

  const existingItem = req.session.cart.find((item) => {
    return item.productId === id;
  })

  if(existingItem) {
    existingItem.quantity += parseInt(quantity);
  } else {
      req.session.cart.push({
    productId: id,
    quantity: quantity
  });
  }

  res.redirect("/");
})

app.get("/customer/cart", async(req, res) => {
  const productIds = req.session.cart.map((item) => {
    return item.productId;
  })
  const products = await Product.find({_id: {$in: productIds}});

  const cartItems = products.map((product) => {
    const sessionItem = req.session.cart.find((item) => {
      return item.productId === product._id.toString();
    })
    return {
      product,
      quantity: sessionItem.quantity
    }
  })

  res.render("cart.ejs", { cartItems });

})

// Admin pannel

app.get("/admin/products", isAdmin, async(req, res) => {
  const products = await Product.find({});
  res.render("admin/show.ejs", {products});
})

//New Product

app.get("/admin/products/new", isAdmin, (req, res) => {
  res.render("admin/new.ejs")
})

app.post("/admin/products", isAdmin, async (req, res) => {
  const newProduct = new Product(req.body);
  await newProduct.save();
  res.redirect("/admin/products");
})

//Delete Product

app.delete("/admin/product/:id", isAdmin, async(req, res) => {
  let {id} = req.params;
  const delProd = await Product.findByIdAndDelete(id);
  console.log(delProd);
  res.redirect("/admin/products");
})

// Edit Product

app.get("/admin/product/:id/edit", async(req, res) => {
  let {id} = req.params;
  const product = await Product.findById(id);
  res.render("admin/edit.ejs", { product });
})

app.patch("/admin/product/:id", async(req, res) => {
  let {id} = req.params;
  const updatedProduct = await Product.findByIdAndUpdate(id, {
    name: req.body.name,
    price: req.body.price,
    stock: req.body.stock,
    discount: req.body.discount,
    sizes: req.body.sizes,
    category: req.body.category,
    description: req.body.description,
    images: req.body.images,
    color: req.body.color,
  });
  console.log(updatedProduct);
  res.redirect("/admin/products");
})





app.listen(port, () => {
    console.log("Server is now listening on port 3000");
})