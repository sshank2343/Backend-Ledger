const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service.js");
const tokenBlacklistModel = require("../models/blackList.model.js");

/** 
 * - user register controller
 * - POST /api/auth/register
 */
const userRegisterController = async (req, res) => {
    const {email,password,name} = req.body;
    const isExists = await userModel.findOne({
        email:email
    })
    if(isExists){
        return res.status(422).json({
            status:"fail",
            message:"User already exists"
        })
    }
    const user = await userModel.create({
        email,password,name
    })

    const token =jwt.sign({userId:user._id},process.env.JWT_SECRET,{
        expiresIn:"3d"
    })
    res.cookie("token",token,)
    res.status(201).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        status:"success",
        message:"User registered successfully",
        token
    })
    await emailService.sendRegistrationEmail(user.email, user.name);
}


/**
 *  - user login controller
 * - POST /api/auth/login
 */

async function userLoginController(req,res){
    const {email,password} =req.body

    const user = await userModel.findOne({email}).select("+password")
    // console.log("------User------",user)
    if(!user){
        return res.status(401).json({
            status:"fail",
            message:"User not found"
        })
    }
    const isValid = await user.comparePassword(password)
    if(!isValid){
        return res.status(401).json({
            status:"fail",
            message:"Invalid password"
        })
    }
    const token = jwt.sign({userId:user._id},process.env.JWT_SECRET,{
        expiresIn:"3d"
    })
     res.cookie("token",token,)
    res.status(200).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        status:"success",
        message:"User logged in successfully",
        token
    })
}


/**
 * - user logout controller
 * - POST /api/auth/logout
 */

async function userLogoutController(req,res){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if(!token){
        return res.status(400).json({
            status:"fail",
            message:"User is not logged in"
        })
    }
    
    await tokenBlacklistModel.create({
        token:token
    })
    res.clearCookie("token")
    res.status(200).json({
        status:"success",
        message:"User logged out successfully"
    })

}

module.exports={
    userRegisterController,
    userLoginController,
    userLogoutController
}