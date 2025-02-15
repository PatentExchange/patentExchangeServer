require("dotenv").config()
const express = require("express")
const cors = require("cors")
const connectDB = require("./config/database")
const userRoutes = require("./routes/userRoutes");
const patentRoutes = require("./routes/patentRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const transferRoutes = require("./routes/transferRoutes");
const path = require("path")

const app = express()

connectDB();

app.use(cors({origin:"*"}));
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/",userRoutes)
app.use("/",patentRoutes)
app.use("/",orderRoutes)
app.use("/admin",adminRoutes)
app.use("/",transferRoutes)

app.listen(3002,()=>{console.log("Server has started")})
