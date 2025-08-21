const express=require("express")
const router=express.Router()
const User = require("../models/User")

const{
    login,
    signup,
    sendotp,
    changePassword,
    getAllUserDetails
}=require("../controllers/Auth")

const {
    getUserByCardId,
    updateMedicalProfile,
    checkProfileStatus
} = require("../controllers/ProfileController")

const{
    resetPasswordToken,
    resetPassword,
}=require("../controllers/ResetPassword")

const {auth}=require("../middlewares/auth")


// Routes for login,signup and authentication

// Authentication routes

// Route for user login
router.post("/login",login)

// Route for user signup
router.post("/signup",signup)

// Route for sending OTP to the user's email
router.post("/sendotp",sendotp)
// router.post("/validateotp",validateotp)

// Route for changing the password
router.post("/changepassword",auth,changePassword)


// Reset Password

// Route for generating a reset password token
router.post("/reset-password-token",resetPasswordToken)

// Route for resetting user's password after verification
router.post("/reset-password",resetPassword)


router.get("/getUserDetails",auth,getAllUserDetails)

// Route to get user by Arogya Netra Card ID (for healthcare professionals)
router.get("/getUserByCardId/:cardId", auth, getUserByCardId)

// Route to get card ID for a user (if they don't have one yet)
router.post("/getArogyaNetraCardId", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.accountType !== 'User') {
            return res.status(400).json({
                success: false,
                message: 'Only regular users can have Arogya Netra Cards'
            });
        }

        // If user already has a card ID, return it
        if (user.arogyaNetraCard && user.arogyaNetraCard.cardId) {
            return res.status(200).json({
                success: true,
                message: 'Arogya Netra Card ID already exists',
                cardDetails: {
                    cardId: user.arogyaNetraCard.cardId,
                    issueDate: user.arogyaNetraCard.issueDate || new Date(),
                    status: user.arogyaNetraCard.status || 'active'
                }
            });
        }

        // Generate a unique card ID (AN-prefix + timestamp + last 4 digits of Aadhar)
        const timestamp = Date.now().toString().slice(-6);
        let aadharLastDigits = "0000"; // Default value

        if (user.aadharNumber) {
            // Make sure aadharNumber is a string and remove spaces
            const aadharStr = String(user.aadharNumber).replace(/\s/g, '');
            aadharLastDigits = aadharStr.slice(-4);
        }

        const cardId = `AN-${timestamp}-${aadharLastDigits}`;
        const issueDate = new Date();

        // Update user with card ID
        user.arogyaNetraCard = {
            cardId,
            issueDate,
            status: 'active'
        };

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Arogya Netra Card ID generated successfully',
            cardDetails: {
                cardId,
                issueDate,
                status: 'active'
            }
        });
    } catch (error) {
        console.error('Error generating Arogya Netra Card ID:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate Arogya Netra Card ID',
            error: error.message
        });
    }
})

// Route to check if user needs to complete profile
router.get("/check-profile-status", auth, checkProfileStatus)

// Route to update medical profile
router.post("/update-medical-profile", auth, updateMedicalProfile)

// Export the router for use in the main application
module.exports=router