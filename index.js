require("dotenv").config()
const express = require("express")
const cors = require("cors")
const connectDB = require("./config/database")
const userRoutes = require("./routes/userRoutes");
const patentRoutes = require("./routes/patentRoutes");

const app = express()

connectDB();

app.use(cors({origin:"*"}));
app.use(express.json())
app.use("/",userRoutes)
app.use("/",patentRoutes)

app.listen(3002,()=>{console.log("Server has started")})
