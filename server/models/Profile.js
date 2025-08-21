const mongoose=require('mongoose');

const profileSchema=new mongoose.Schema({
    gender:{
        type:String,
        trim:true,
    },
    dateOfBirth:{
        type:String,
    },
    about:{
        type:String,
        trim:true,
    },
    bloodGroup:{
        type:String,
        trim:true,
    },
    height:{
        type:Number,
    },
    weight:{
        type:Number,
    },
    address:{
        street: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
        },
        pincode: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            trim: true,
            default: 'India',
        },
    },
    emergencyContact:{
        name: {
            type: String,
            trim: true,
        },
        relationship: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
    },
    medicalConditions: [String],
    allergies: [String],
    medications: [String],
    isProfileComplete: {
        type: Boolean,
        default: false,
    },
    firstLogin: {
        type: Boolean,
        default: true,
    },
})

module.exports=mongoose.model("Profile",profileSchema);