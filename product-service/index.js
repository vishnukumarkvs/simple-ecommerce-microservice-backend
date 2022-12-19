const express = require("express")
const app = express();
const mongoose = require("mongoose");
const amqp = require("amqplib");
const Product = require("./Product") 
const isAuthenticated = require("../isAuthenticated");
var channel, connection;

app.use(express.json()); // Without `express.json()`, `req.body` is undefined.

mongoose.connect("mongodb://localhost:4000/product-service",
   { useNewUrlParser: true, useUnifiedTopology: true},
   ()=>{
     console.log('Product-Service DB is connected');
   }
)
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

async function connect(){
  const amqpServer = 'amqp://localhost:5672';
  connection = await amqp.connect(amqpServer);
  channel = await connection.createChannel();
  await channel.assertQueue("PRODUCT");
  //await connection.close();
}
connect();

//Create a new Product
// Buy a product

app.post("/product/create", isAuthenticated, async (req,res)=>{
  const {name,description, price} = req.body;
  const newProduct = new Product({
    name: name,
    description: description,
    price: price
  })
  newProduct.save();
  return res.json(newProduct);
})

app.post("/product/buy", isAuthenticated, async (req,res)=>{
  const {ids} = req.body;
  const products = await Product.find({_id : {$in: ids} })
  channel.sendToQueue("ORDER",Buffer.from(JSON.stringify({
    products,
    userEmail: req.user.email, // user info will get from token(token contain payload)
  })))
  //console.log(req.user);
})

const PORT = process.env.PORT || 9090
app.listen(PORT, ()=>{
    console.log(`Product-Service at ${PORT}`)
})