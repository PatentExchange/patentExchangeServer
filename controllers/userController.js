const argon2 = require("argon2")
const UserModel = require("../models/Users")
const jwt = require("jsonwebtoken")
const dayjs = require("dayjs")
const mongoose = require("mongoose")




exports.signup = async (req, res) => {
    try {
        const user = await UserModel.create(req.body);
        const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET);
        res.status(201).json({ message: "Signup successful!", token });
    } catch (e) {
        res.status(500).json({ message: "An error occurred during signup.", error: e });
    }
};
exports.login = async (req, res) => {
    try {
        const uf = await UserModel.findOne({ email: req.body.email });
        if (uf) {
            const isPasswordValid = await argon2.verify(uf.password, req.body.password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: "Invalid password." });
            }
            uf.lastLogin = dayjs().format("MM/DD/YYYY HH:mm:ss");
            await uf.save();
            const token = jwt.sign({ id: uf._id, name: uf.name, email: uf.email }, process.env.JWT_SECRET);
            res.status(200).json({ message: "Login successful!", token });
        } else {
            res.status(400).json({ message: "User not found." });
        }
    } catch (error) {
        res.status(500).json({ message: "An error occurred during login.", error });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "An error occurred while fetching users.", error });
    }
};

exports.getUserById = async (req, res) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
    }
    try {
        const user = await UserModel.findById(id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "An error occurred while fetching the user.", error });
    }
};