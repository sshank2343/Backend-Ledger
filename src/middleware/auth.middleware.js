const userModel = require('../models/user.model');
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blackList.model");

async function authMiddleware(req,res,next){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if(!token){
        return res.status(401).json({
            status:"fail",
            message:"Unauthorized,token is missing"
        })
    }
    const isBlacklisted = await tokenBlacklistModel.findOne({token:token});
    if(isBlacklisted){
        return res.status(401).json({
            status:"fail",
            message:"Unauthorized,token is blacklisted"
        })
    }
    try{
        const decodde=jwt.verify(token,process.env.JWT_SECRET);
        const user = await userModel.findById(decodde.userId);
        req.user = user;
        next();

    }catch(err){
        return res.status(401).json({
            status:"fail",
            message:"Unauthorized,invalid token"
        })
    }
}


async function authSystemUserMiddleware(req,res,next){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if(!token){
        return res.status(401).json({
            status:"fail",
            message:"Unauthorized,token is missing"
        })
    }
    const isBlacklisted = await tokenBlacklistModel.findOne({token:token});
    if(isBlacklisted){
        return res.status(401).json({
            status:"fail",
            message:"Unauthorized,token is blacklisted"
        })
    }
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.userId).select("+systemUser");
        if(!user.systemUser){
            return res.status(403).json({
                status:"fail",
                message:"Forbidden, user is not a system user"
            })
        }
        req.user = user;
        next();
    }catch(err){
        return res.status(401).json({
            status:"fail",
            message:"Unauthorized,invalid token"
        })
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware

}