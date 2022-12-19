const express = require("express")
const app = express();
const mongoose = require("mongoose");
const amqp = require("amqplib");
const Order = require("./Order") 
const isAuthenticated = require("../isAuthenticated");
var channel,connection;
app.use(express.json()); // Without `express.json()`, `req.body` is undefined.

mongoose.connect("mongodb://localhost:4000/Order-service",
   { useNewUrlParser: true, useUnifiedTopology: true},
   ()=>{
     console.log('Order-Service DB is connected');
   }
)
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

async function connect(){
  const amqpServer = 'amqp://localhost:5672';
  connection = await amqp.connect(amqpServer);
  channel = await connection.createChannel();
  await channel.assertQueue("ORDER");
  //await connection.close();
}
function createOrder(products, email){
    let total = 0;
    for(let i=0;i<products.length;i++){
        total+=products[i].price;
    }
    const newOrder = new Order({
        products: products,
        user: email,
        total_price: total
    })
    newOrder.save();
    return newOrder;
}
connect().then(()=>{
    channel.consume("ORDER", data => {
        const {products, userEmail} = JSON.parse(data.content);
        console.log("Consuming ORDER queue");
        console.log(products);
        // console.log(userEmail);
        const newOrder = createOrder(products,userEmail);
        channel.ack(data);
    })
})


const PORT = process.env.PORT || 2020
app.listen(PORT, ()=>{
    console.log(`Order-Service at ${PORT}`)
})