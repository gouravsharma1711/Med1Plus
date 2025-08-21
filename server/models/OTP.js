const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    contactType: {
        type: String,
        enum: ['sms', 'email', 'whatsapp'], // Valid contact types
        required: true
    },
    contactValue: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    // expiryTime: {
    //     type: Date,
    //     default: new Date(Date.now() + 5 * 60 * 1000)
    // },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create a TTL index that expires 10 minutes after OTP creation
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });


module.exports=mongoose.model("OTP",otpSchema);