const jwt=require('jsonwebtoken');
require('dotenv').config();
const User=require('../models/User');

// auth
exports.auth=async(req,res,next)=>{
    try{
        // extract token
        console.log("1")
        console.log(req.header("Authorization"))
        const token=req.cookies.token||req.body.token||req.header("Authorization").replace("Bearer ","");
        console.log("2")
        console.log(token)
        
        // if token missing,then return response
        if(!token){
            return res.status(401).json({
                success:false,
                message:"Token is missing",
            })
        }
        console.log("3")

        // verify the token
        try{
            console.log("4")
            const decode=await jwt.verify(token,process.env.JWT_SECRET);
            console.log(decode);
            req.user=decode;
        }catch(err){
            console.log("first",err)
            // verification issue
            return res.status(401).json({
                success:false,
                message:"Token is invalid",
            })
        }
        next();
    }catch(error){
        console.log("second",error)
        // verification issue
        return res.status(401).json({
            success:false,
            message:"Something went wrong while validating the token",
        })
    }
}

// isSeller
exports.isUser=async(req,res,next)=>{
    try{
        if(req.user.accountType!="User"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for user only",
            }) 
        }
        next();
    }catch(error){
        return res.status(500).json({
            success:false,
            message:'User role cannot be verified,please try again',
        })
    }
}

// isBuyer
exports.isDoctor=async(req,res,next)=>{
    try{
        if(req.user.accountType!="Doctor"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for doctor only",
            }) 
        }
        next();
    }catch(error){
        return res.status(500).json({
            success:false,
            message:'User role cannot be verified,please try again',
        })
    }
}

//isAdmin
exports.isAdmin=async(req,res,next)=>{
    try{
        if(req.user.accountType!="Admin"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for admin only",
            }) 
        }
        next();
    }catch(error){
        return res.status(500).json({
            success:false,
            message:'User role cannot be verified,please try again',
        })
    }
}