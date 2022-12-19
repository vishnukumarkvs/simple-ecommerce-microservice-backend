const express = require("express")
const app = express();
const mongoose = require("mongoose");
const User = require("./User")
const jwt = require("jsonwebtoken")
app.use(express.json());
mongoose.connect("mongodb://localhost:4000/auth-service",
   { useNewUrlParser: true, useUnifiedTopology: true},
   ()=>{
     console.log('Auth-Service DB is connected');
   }
)

// Get the default connection
const db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const PORT = process.env.PORT || 7070
// Without `express.json()`, `req.body` is undefined.

//Register
//Login

app.post("/auth/register", async (req,res)=>{
    const {email, password, name} = await req.body;
    const userExists = await User.findOne({email});
    if (userExists){
        return res.json({message: "User Already Exists"});
    }else{
        const newUser = new User({
            name,
            email,
            password, // hash in production
        });
        try{
            await newUser.save();
        }catch(err){
            console.log(err)
        }
        return res.json(newUser);
    }
})

app.post("/auth/login", async (req,res)=>{
    const {email,password} = req.body;
    const user = await User.findOne({email});
    if(!user){
        return res.json({message: "User doesnt exits"})
    }else{
        // check if enteres password is valid
        if(password !== user.password){
            return res.json({message: "Password Incorrect"});
        }
        const payload = {
            email,
            name: user.name
        };
        jwt.sign(payload, "secret", (err,token)=>{
            if(err) console.log(err);
            else{
                return res.json({token : token});
            }
        })
    }
})

app.listen(PORT, ()=>{
    console.log(`Auth-Service at ${PORT}`)
})