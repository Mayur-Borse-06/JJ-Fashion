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
const ExpressError = require("./utils/ExpressError");
const pdf = require("html-pdf-node");
const ejs = require('ejs');

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
    res.redirect("/admin/dashboard");
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
  if(req.session.cart) {
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
  } else {
    throw new ExpressError(400, "You have not added any items in the cart");
  }

})

// Admin pannel

// Main dashboard

app.get("/admin/dashboard", isAdmin, async(req, res) => {
  const orders = await Order.find({});
  const totalSales = orders.reduce((acc, order) => acc + order.totalAmount, 0);
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({status: {$in: ["Placed"]} })
  const processingOrders = await Order.countDocuments({status: {$in: ["Shipped", "Processing"]}});
  const deliveredOrders = await Order.countDocuments({status: {$in: ["Delivered"]}});

  const recentOrders = await Order.find({status: "Placed"})
    .sort({orderedAt: -1}) // Descending time(latest order time)
    .limit(5)
    .populate("customer")

  res.render("admin/dashboard.ejs", { totalSales, totalOrders, pendingOrders, processingOrders, deliveredOrders, recentOrders });
})

// Products show page
app.get("/admin/products", isAdmin, async(req, res) => {
  const products = await Product.find({});
  res.render("admin/products/show.ejs", {products});
})

//New Product

app.get("/admin/products/new", isAdmin, (req, res) => {
  res.render("admin/products/new.ejs")
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

app.get("/admin/product/:id/edit", isAdmin, async(req, res) => {
  let {id} = req.params;
  const product = await Product.findById(id);
  res.render("admin/products/edit.ejs", { product });
})

app.patch("/admin/product/:id", isAdmin, async(req, res) => {
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

  res.redirect("/admin/products");
})


// view orders

app.get("/admin/orders", isAdmin, async(req, res) => {
  const filter = req.query.status;  // Orders filtering
  const query = filter ? {status: filter} : {}

  const orders = await Order.find(query).populate("customer");
  res.render("admin/orders/index.ejs", {orders})
})

// view individual order

app.get("/admin/orders/:id", isAdmin, async(req, res) => {
  const order = await Order.findById(req.params.id).populate("customer").populate("product");
  res.render("admin/orders/show.ejs", { order });
})

// accept order

app.patch("/admin/orders/:id/accept", isAdmin, async(req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, {status: "Processing"});
  res.redirect("/admin/orders");
})

// mark as shipped

app.patch("/admin/orders/:id/shipped", isAdmin, async(req, res) => {
    const order = await Order.findByIdAndUpdate(req.params.id, {status: "Shipped"});
    res.redirect("/admin/orders");
})

// mark as delivered

app.patch("/admin/orders/:id/delivered", isAdmin, async(req, res) => {
    const order = await Order.findByIdAndUpdate(req.params.id, {status: "Delivered"});
    res.redirect("/admin/orders");
})

app.get("/admin/customers", isAdmin, async(req, res) => {
  const customers = await Customer.find({isAdmin: {$ne: true}});

  for(customer of customers) {
    const count = await Order.countDocuments({customer: customer._id});
    const lastOrder = await Order.findOne({customer: customer._id}).sort({orderedAt: -1})
    customer.totalOrders = count;
    customer.lastOrder = lastOrder ? lastOrder : null;
    
  }

  res.render("admin/customers/index.ejs", { customers });
})

// Invoice 


app.get("/invoice/:orderId", async (req, res) => {
  let { orderId } = req.params;
  const order = await Order.findById(orderId).populate("customer").populate("product");

  const subtotal = order.product.price * order.quantity;
  const gstAmount = subtotal * 0.05;
  const total = subtotal + gstAmount;

  const html = await ejs.renderFile(
    path.join(__dirname, "views/layouts/invoiceTemplate.ejs"),
    { order, subtotal, gstAmount, total }
  );

  let file = { content: html };

  pdf.generatePdf(file, { format: "A4" }).then((pdfBuffer) => {
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=invoice.pdf',
    });
    res.send(pdfBuffer);
  }).catch((err) => {
    console.error("PDF Generation Error:", err);
    res.status(500).send("Error generating PDF");
  });
});


app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Internal Server Error" } = err;
  res.status(statusCode).render("error.ejs", { statusCode, message });
});










app.listen(port, () => {
    console.log(`Server is now listening on port ${port}`);
})