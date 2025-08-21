const mongoose=require('mongoose');

const userSchema=new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
        trim:true,
    },
    lastName:{
        type:String,
        required:true,
        trim:true,
    },
    email:{
        type:String,
        required:true,
        trim:true,
    },
    mobile_no:{
        type:String,
        required:true,
        trim:true,
    },
    password:{
        type:String,
        required:true,
        trim:true,
    },
    accountType:{
        type:String,
        enum: ["User","Doctor"],
        default:"User",
    },
    image:{
        type:String,
        // required:true,
    },
    additionalDetails:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Profile",
    },
    aadharNumber:{
        type:String,
        required:true,
    },
    aadharCard:{
        type:String,
        required:true,
    },
    arogyaNetraCard: {
        cardId: {
            type: String,
            sparse: true, // Allow multiple null values (only enforce uniqueness on non-null values)
        },
        issueDate: {
            type: Date,
        },
        cardImage: {
            type: String,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "pending"],
            default: "pending",
        }
    },
    documents: [{
        fileName: {
            type: String,
            required: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
        fileSize: {
            type: Number,
        },
        fileType: {
            type: String,
        },
        category: {
            type: String,
            enum: ["prescription", "medical_report", "lab_result", "other"],
            default: "other",
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        }
    }],
    token:{
        type:String,
    },
    resetPasswordExpires:{
        type:Date,
    },
})

module.exports=mongoose.model("User",userSchema);