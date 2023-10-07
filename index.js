import express from "express";
import path from "path";
import mongoose from "mongoose";
// cookie-parser is a middleware which parses cookies attached to the client request object.
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

mongoose.connect("mongodb://localhost:27017" ,{
    dbName : "backend"
}).then(() => console.log("Database Connected")).catch((e) => console.log(e));

const userSchema = new mongoose.Schema({
    name : String ,
    email : String ,
    password : String
});

const User = mongoose.model("User" , userSchema)

const app = express();

// Using Middlewares
app.use(express.static(path.join(path.resolve() , "public")));
app.use(express.urlencoded({ extended : true }));
app.use(cookieParser());

// Setting up view engine
app.set("view engine" , "ejs");

const isAuthenticated = async(req , res , next) => {
    const token = req.cookies.token;

    if(token){
        const decoded = jwt.verify( token , "adityapathak");
        req.user = await User.findById(decoded._id);
        next();
    } else {
        res.redirect("/login"); 
    }
}

app.get("/" , isAuthenticated ,(req , res) => {
    // console.log(req.user);
    res.render("logout.ejs" , { name : req.user.name }); 
});
app.get("/register" , (req , res) => {
    res.render("register.ejs"); 
});

app.post("/login" , async(req , res) => {

    const {email , password } = req.body;
    let user = await User.findOne({ email });
    if(!user) return res.redirect("/register");

    const isMatch = bcrypt.compare(password , user.password);
    const message = "Incorrect Password" ;
    if(!isMatch) return res.render("login" , { email , message });

    const token = jwt.sign({_id : user._id} , "adityapathak");
    res.cookie("token" , token , {
        httpOnly : true ,
        expires : new Date(Date.now() + 60*1000)
    });
    res.redirect("/");
});

app.post("/register" , async(req ,res) => {
    const { name , email , password } = req.body;

    let user = await User.findOne({ email });
    if(user){
        return res.redirect("/login");
    }

    const hashedPassword = bcrypt.hash(password , 10);
    
    user = await User.create({ name , email , password : hashedPassword });

    const token = jwt.sign({_id : user._id} , "adibhai123");
    res.cookie("token" , token , {
        httpOnly : true ,
        expires : new Date(Date.now() + 60*1000)
    });
    res.redirect("/");
});

app.get("/login" , (req , res) => {
    res.render("login.ejs");
});

app.get("/logout" , (req ,res) => {
    res.cookie("token" , null , {
        httpOnly : true ,
        expires : new Date(Date.now())
    });

    res.redirect("/");
});

app.listen(3000 , () => {
    console.log("Server is Working");
});
