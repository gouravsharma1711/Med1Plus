const User=require("../models/User");
const OTP=require("../models/OTP");
const Profile=require("../models/Profile");
const otpGenerator=require('otp-generator');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const mailSender=require("../utils/mailSender");
// const {passwordUpdated}=require("../mail/templates/passwordUpdate");
require('dotenv').config();
const { uploadImageToCloudinary } = require('../utils/imageUploader');
const cloudinary = require('cloudinary').v2;
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const twilio = require('twilio');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const { Canvas, Image, ImageData } = require('canvas');
const { createCanvas, loadImage } = require('canvas'); // This is to create the image in canvas format
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Twilio Client Setup (replace with your credentials)
const twilioClient = twilio(`${process.env.TWILIO_KEY1}`, `${process.env.TWILIO_KEY2}`);

const generateOtp = () => {
    return otpGenerator.generate(6,{
        upperCaseAlphabets:false,
        lowerCaseAlphabets:false,
        specialChars:false,
    })
};

const sendSms = async (otp, mobileNumber) => {
    console.log(mobileNumber)
  try {
    await twilioClient.messages.create({
      body: `Your OTP code is: ${otp}`,
      from: '+12768006121',
      to: `+91${mobileNumber}`,
    });
  } catch (err) {
    console.log(err)
    throw new Error('Error sending SMS');
  }
};

const sendEmail = async (otp, email) => {
  try {
    await mailSender(email,
        "Your OTP Code",
        `Your OTP code is: ${otp}`);
  } catch (err) {
    throw new Error('Error sending Email');
  }
};

const sendWhatsapp = async (otp, mobileNumber) => {
  try {
    await twilioClient.messages.create({
      body: `Your OTP code is: ${otp}`,
      from: 'whatsapp:+14155238886',
      to: `whatsapp:+91${mobileNumber}`,
    });
  } catch (err) {
    throw new Error('Error sending WhatsApp');
  }
};

let a="";

// Send OTP API
exports.sendotp = async (req, res) => {
    try {
      console.log("Hello world");
      
        const { contactType, contactValue } = req.body; // contactType could be 'mobile', 'email', 'whatsapp'
        
        // check if user already exist
        const checkUserPresent=await User.findOne({contactValue});

        // if user already exist,then return a response
        if(checkUserPresent){
            return res.status(401).json({
                success:false,
                message:'User already registered',
            })
        }

        a=contactType

        // generate otp
        const otp = generateOtp();
        console.log("OTP generated: ",otp);

        // check unique OTP or not
        const result=await OTP.findOne({otp:otp})

        while(result){
            otp=generateOtp();
            console.log("OTP generated: ",otp);
            result=await OTP.findOne({otp:otp});
        }

        // const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

        // Save OTP to DB
        const newOtp = new OTP({ contactType, contactValue, otp });
        console.log(newOtp);
        await newOtp.save();

        
        if (contactType === 'sms') {
            await sendSms(otp, contactValue);
        } else if (contactType === 'email') {
            await sendEmail(otp, contactValue);
        } else if (contactType === 'whatsapp') {
            await sendWhatsapp(otp, contactValue);
        }
        
        // return response successful
        res.status(200).json({
            success:true,
            message:'OTP sent successfully',
            otp,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success:false,
            message:`Error sending OTP via ${a}`,
            error:error.message,
        })
    }
}

// // Validate OTP API
// exports.validateotp =  async (req, res) => {
//     const { contactValue, otp } = req.body;
//     const otpRecord = await OTP.findOne({ contactValue });

//     if (!otpRecord) {
//         return res.status(400).json({ message: 'OTP not found' });
//     }

//     // Check if OTP has expired
//     if (new Date() > otpRecord.expiryTime) {
//         return res.status(400).json({ message: 'OTP expired' });
//     }

//     // Validate OTP
//     if (otpRecord.otp === otp) {
//         return res.status(200).json({ message: 'OTP verified successfully' });
//     } else {
//         return res.status(400).json({ message: 'Invalid OTP' });
//     }
// }


// Load the face-api models (ensure models are stored locally or on cloud storage)
async function loadFaceApiModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./frmodels');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./frmodels');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./frmodels');
}

// Function to extract face descriptor from an image buffer
async function extractFaceDescriptor(imageBuffer) {
  try {        
    // Load the image from the buffer (this creates an image element)
    const img = await loadImage(imageBuffer);
    
    // Create a canvas element and draw the image onto it
    const canvasElement = createCanvas(img.width, img.height);
    const ctx = canvasElement.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height); // Draw the image on the canvas

    // Use face-api.js to detect faces in the image on the canvas
    const detections = await faceapi.detectAllFaces(canvasElement).withFaceLandmarks().withFaceDescriptors();
    
    // If no faces are detected, throw an error
    if (!detections || detections.length === 0) {
      throw new Error('No face detected in the image');
    }

    // Return the first face descriptor (you can modify this to handle multiple faces)
    return detections[0].descriptor;
  } catch (error) {
    console.error('Error extracting face descriptor:', error);
    throw error;
  }
}

// Function to generate Arogya Netra Card
exports.generateArogyaNetraCard = async (user, imageUrl) => {
  try {
    // Generate a unique card ID (AN-prefix + timestamp + last 4 digits of Aadhar)
    const timestamp = Date.now().toString().slice(-6);
    const aadharLastDigits = user.aadharNumber.replace(/\s/g, '').slice(-4);
    const cardId = `AN-${timestamp}-${aadharLastDigits}`;

    // Create card image using Canvas
    const canvas = createCanvas(1000, 600);
    const ctx = canvas.getContext('2d');

    // Card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1000, 600);

    // Blue header
    ctx.fillStyle = '#0047AB';
    ctx.fillRect(0, 0, 1000, 100);

    // Card border
    ctx.strokeStyle = '#0047AB';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, 1000, 600);

    try {
      // National Emblem
      const emblemImage = await loadImage('https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg');
      ctx.drawImage(emblemImage, 30, 20, 60, 60);
    } catch (err) {
      console.log("Error loading emblem image:", err);
      // Draw a placeholder if emblem can't be loaded
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(30, 20, 60, 60);
    }

    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('AROGYA NETRA CARD', 120, 60);

    ctx.font = '16px Arial';
    ctx.fillText('Government of India | Ministry of Health and Family Welfare', 120, 85);

    try {
      // User image - use a default image if user.image is not available
      const imageUrl = user.image || `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(user.firstName + ' ' + user.lastName)}`;
      const userImage = await loadImage(imageUrl);
      ctx.drawImage(userImage, 50, 150, 200, 200);
    } catch (err) {
      console.log("Error loading user image:", err);
      // Draw a placeholder if user image can't be loaded
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(50, 150, 200, 200);
      ctx.fillStyle = '#666666';
      ctx.font = 'bold 40px Arial';
      ctx.fillText(user.firstName.charAt(0), 130, 250);
    }

    // Card details
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Personal Details', 300, 150);

    ctx.font = '20px Arial';
    ctx.fillText(`Name: ${user.firstName} ${user.lastName}`, 300, 190);
    ctx.fillText(`Card ID: ${cardId}`, 300, 230);
    ctx.fillText(`Aadhar: XXXX XXXX ${aadharLastDigits}`, 300, 270);
    ctx.fillText(`Mobile: ${user.mobile_no}`, 300, 310);
    ctx.fillText(`Email: ${user.email}`, 300, 350);

    // Issue date
    const issueDate = new Date();
    ctx.fillText(`Issue Date: ${issueDate.toLocaleDateString()}`, 300, 390);

    // QR Code placeholder (in a real app, generate an actual QR code)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(750, 150, 200, 200);
    ctx.font = '16px Arial';
    ctx.fillText('Scan QR Code', 790, 370);
    ctx.fillText('for verification', 790, 390);

    // Footer
    ctx.fillStyle = '#0047AB';
    ctx.fillRect(0, 500, 1000, 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText('This card is issued by the Government of India and is valid throughout the country.', 50, 540);
    ctx.fillText('The cardholder is entitled to access healthcare services under the National Health Program.', 50, 570);

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');

    // Create a temporary file for Cloudinary upload
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    // Use the OS temp directory instead of a relative path
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `${user._id}_card.png`);

    // Write buffer to temporary file
    fs.writeFileSync(tempFilePath, buffer);

    // Upload to Cloudinary using the file path
    const result = await cloudinary.uploader.upload(tempFilePath, {
      folder: 'ArogyaNetraCards',
      public_id: `${user._id}_arogya_netra_card`,
      overwrite: true
    });

    // Clean up temporary file
    fs.unlinkSync(tempFilePath);

    return {
      cardId,
      issueDate,
      cardImage: result.secure_url,
      status: 'active'
    };
  } catch (error) {
    console.error('Error generating Arogya Netra Card:', error);
    throw error;
  }
};

// Example usage in signup function:
exports.signup = async (req, res) => {
    try {
      const { firstName, lastName, mobile_no, email, userType, password, confirmPassword } = req.body;
      console.log(firstName, lastName, mobile_no, userType, email, password, confirmPassword);

      const adhar = req.files?.aadharFile;
      const image = req.files?.webcamImage;

      if (!adhar) {
        return res.status(400).json({
          success: false,
          message: 'Aadhaar not found in the file',
        });
      }

      // Upload Aadhaar image to Cloudinary
      const cloudinaryResult = await uploadImageToCloudinary(adhar, 'Aadhar', 500, 'auto');

      // Default avatar using DiceBear API if no image is provided
      let imageResult = {
        secure_url: `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(firstName + ' ' + lastName)}`
      };

      // If image is provided, upload it
      if (image) {
        try {
          imageResult = await uploadImageToCloudinary(image, 'Profile', 500, 'auto');
        } catch (imageError) {
          console.error("Error uploading profile image:", imageError);
          // Continue with default avatar if image upload fails
        }
      }

      // Handle Aadhaar file processing
      const fileUrl = cloudinaryResult.secure_url;
      const fileType = cloudinaryResult.format;

      let extractedText = '';

      if (fileType === 'pdf') {
          const fileBuffer = await axios.get(fileUrl, { responseType: 'arraybuffer' });
          const data = await pdfParse(fileBuffer.data);
          extractedText = data.text;
        } else if (['png', 'jpeg', 'jpg'].includes(fileType)) {
          const { data: { text } } = await Tesseract.recognize(fileUrl, 'eng', {
              logger: (m) => console.log(m),
            });
            extractedText = text;
      }

      const aadharMatch = extractedText.match(/\b\d{4}\s\d{4}\s\d{4}\b/);
      const aadharNumber = aadharMatch ? aadharMatch[0] : null;

      if (!aadharNumber) {
        return res.status(400).json({
          success: false,
          message: 'Aadhaar number not found in the file',
        });
      }

      // Validate fields
      if (!firstName || !lastName || !mobile_no || !email || !userType || !aadharNumber || !password || !confirmPassword) {
        return res.status(403).json({
          success: false,
          message: 'All fields are required',
        });
      }

      // Password match check
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password and ConfirmPassword does not match, please try again later',
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already registered',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create profile details (additional user info)
      const profileDetails = await Profile.create({
        gender: null,
        dateOfBirth: null,
        about: null,
      });

      // Create user data object
      const userData = {
        firstName,
        lastName,
        email,
        aadharNumber,
        accountType: userType,
        aadharCard: fileUrl,
        password: hashedPassword,
        mobile_no,
        additionalDetails: profileDetails._id,
        image: imageResult.secure_url,
      };

      try {
        // Create user (for both users and doctors)
        const user = await User.create(userData);

        // Generate a basic card ID for users (not doctors)
        if (userType === 'User') {
          try {
            // Generate a unique card ID (AN-prefix + timestamp + last 4 digits of Aadhar)
            const timestamp = Date.now().toString().slice(-6);
            let aadharLastDigits = "0000"; // Default value

            if (user.aadharNumber) {
              // Make sure aadharNumber is a string and remove spaces
              const aadharStr = String(user.aadharNumber).replace(/\s/g, '');
              aadharLastDigits = aadharStr.slice(-4);
            }

            const cardId = `AN-${timestamp}-${aadharLastDigits}`;
            console.log("Generated card ID:", cardId);

            // Just set the card ID and status, but don't generate the image yet
            user.arogyaNetraCard = {
              cardId,
              issueDate: new Date(),
              status: 'active'
            };

            await user.save();
          } catch (error) {
            console.error("Error generating card ID:", error);
            // Continue even if card ID generation fails
          }

          // Return success response with user data
          return res.status(200).json({
            success: true,
            message: 'User registered successfully. You can view your Arogya Netra Card from your dashboard.',
            user,
          });
        } else {
          // Return success response for doctors
          return res.status(200).json({
            success: true,
            message: 'Healthcare professional registered successfully',
            user,
          });
        }
      } catch (error) {
        // If user creation fails, handle the error
        console.error('User creation failed:', error);
        return res.status(500).json({
          success: false,
          message: 'User registration failed',
          error: error.message
        });
      }
    } catch (error) {
      console.error('Error in signup process:', error);
      res.status(500).json({
        success: false,
        message: 'User cannot be registered, please try again',
        error: error.message,
      });
    }
  };
  





// login
exports.login=async(req,res)=>{

    try{
        // fetch data from request ki body
        const{email,password}=req.body;

        // validate krlo
        if(!email||!password){
                return res.status(403).json({
                    success:false,
                    message:"All fields are required",
                })
        }

        // check if user already exist
        const user=await User.findOne({email}).populate("additionalDetails")

        // if user already exist,then return a response
        if(!user){
            return res.status(400).json({
                success:false,
                message:'User is not registered,please signup',
            })
        }

        // generate JWT,after password matching
        if(await bcrypt.compare(password,user.password)){
            const payload={
                email:user.email,
                id:user._id,
                accountType:user.accountType,
            }
            const token=jwt.sign(payload,process.env.JWT_SECRET,{
                expiresIn:"2d",
            })
            user.token=token;
            user.password=undefined;

            // create cookie and send response
            const options={
                expires:new Date(Date.now()+3*24*60*60*1000),
                httpOnly:true,
            }
            res.cookie("token",token,options).status(200).json({
                success:true,
                token,
                user,
                message:"Logged in successfully",
            })
        }
        else{
           return res.status(401).json({
                success:false,
                message:'Password is incorrect',
            })
        }

    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Login failure,please try again",
        })
    }
}


// // changePassword
exports.changePassword=async(req,res)=>{
    try{
        const userId=req.user.id
        const{oldPassword,newPassword}=req.body;
        const user=await User.findById(userId)
        
        console.log("old password",oldPassword)
        console.log("db password",user.password)

        if(!oldPassword || !newPassword){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }

        if(! await bcrypt.compare(oldPassword,user.password)){
            return res.status(401).json({
                success:false,
                message:"Password do not match"
            })
        }

        const hashedPassword=await bcrypt.hash(newPassword,10);

        const updatedUserDetails=await User.findByIdAndUpdate(
            {_id:userId},
            {password:hashedPassword},
            {new:true}
        )

        res.status(200).json({
            success:true,
            message:updatedUserDetails,
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Failed to change password"
        })
    }
}



exports.getAllUserDetails=async(req,res)=>{
    try{
        // get id
        const id=req.user.id;
        console.log(id)

        // validation
        const userDetails=await User.findById({_id:id}).populate("additionalDetails")

        // return response
        return res.status(200).json({
            success:true,
            data:userDetails,
            message:'User data fetched successfully',
        })
    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to fetch user data',
            error:error.message,
        })
    }
}

// Get user by Arogya Netra Card ID (for healthcare professionals)
exports.getUserByCardId = async (req, res) => {
    try {
        const { cardId } = req.params;

        // Check if the requester is a healthcare professional
        if (req.user.accountType !== "Doctor") {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only healthcare professionals can access patient data by card ID',
            });
        }

        // Find user by card ID
        const user = await User.findOne({ 'arogyaNetraCard.cardId': cardId })
            .populate('additionalDetails')
            .select('-password -token -resetPasswordExpires');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with the provided Arogya Netra Card ID',
            });
        }

        // Log access for audit purposes
        console.log(`Doctor ${req.user.id} accessed patient data for user with card ID ${cardId}`);

        // Return user data
        return res.status(200).json({
            success: true,
            user,
            message: 'Patient data fetched successfully',
        });
    } catch (error) {
        console.error('Error fetching user by card ID:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch patient data',
            error: error.message,
        });
    }
}

// Check if user's profile is complete
exports.checkProfileCompletion = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user and populate profile details
    const user = await User.findById(userId).populate('additionalDetails');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if profile exists
    if (!user.additionalDetails) {
      return res.status(200).json({
        success: true,
        isComplete: false,
        message: 'Profile not found'
      });
    }

    // Define required fields based on user type
    const requiredFields = ['gender', 'dateOfBirth'];
    const recommendedFields = ['bloodGroup', 'height', 'weight', 'address.city', 'address.state', 'emergencyContact.phone'];

    // Check if required fields are filled
    const profile = user.additionalDetails;
    const missingRequiredFields = [];
    const missingRecommendedFields = [];

    // Check required fields
    for (const field of requiredFields) {
      const value = getNestedProperty(profile, field);
      if (!value) {
        missingRequiredFields.push(field);
      }
    }

    // Check recommended fields
    for (const field of recommendedFields) {
      const value = getNestedProperty(profile, field);
      if (!value) {
        missingRecommendedFields.push(field);
      }
    }

    // Calculate completion percentage
    const totalFields = requiredFields.length + recommendedFields.length;
    const filledFields = totalFields - (missingRequiredFields.length + missingRecommendedFields.length);
    const completionPercentage = Math.round((filledFields / totalFields) * 100);

    // Profile is complete if all required fields are filled
    const isComplete = missingRequiredFields.length === 0;

    // Update profile completion status
    profile.isProfileComplete = isComplete;
    await profile.save();

    return res.status(200).json({
      success: true,
      isComplete,
      completionPercentage,
      missingRequiredFields,
      missingRecommendedFields,
      message: isComplete ? 'Profile is complete' : 'Profile is incomplete'
    });

  } catch (error) {
    console.error('Error checking profile completion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check profile completion',
      error: error.message
    });
  }
};

// Helper function to get nested property value
function getNestedProperty(obj, path) {
  return path.split('.').reduce((prev, curr) => {
    return prev && prev[curr] ? prev[curr] : null;
  }, obj);
}

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      gender,
      dateOfBirth,
      bloodGroup,
      height,
      weight,
      address,
      emergencyContact,
      medicalConditions,
      allergies,
      medications,
      about
    } = req.body;

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find or create profile
    let profile = await Profile.findById(user.additionalDetails);

    if (!profile) {
      profile = new Profile({});
    }

    // Update profile fields if provided
    if (gender) profile.gender = gender;
    if (dateOfBirth) profile.dateOfBirth = new Date(dateOfBirth);
    if (bloodGroup) profile.bloodGroup = bloodGroup;
    if (height) profile.height = height;
    if (weight) profile.weight = weight;

    // Update address if provided
    if (address) {
      profile.address = {
        ...profile.address,
        ...address
      };
    }

    // Update emergency contact if provided
    if (emergencyContact) {
      profile.emergencyContact = {
        ...profile.emergencyContact,
        ...emergencyContact
      };
    }

    // Update medical conditions if provided
    if (medicalConditions) {
      profile.medicalConditions = medicalConditions;
    }

    // Update allergies if provided
    if (allergies) {
      profile.allergies = allergies;
    }

    // Update medications if provided
    if (medications) {
      profile.medications = medications;
    }

    // Update about if provided
    if (about) {
      profile.about = about;
    }

    // Check if required fields are filled
    const requiredFields = ['gender', 'dateOfBirth'];
    const isComplete = requiredFields.every(field => getNestedProperty(profile, field));

    profile.isProfileComplete = isComplete;

    // Save profile
    await profile.save();

    // If this is a new profile, update user with profile ID
    if (!user.additionalDetails) {
      user.additionalDetails = profile._id;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile,
      isComplete
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Verify card and get user data by scanning QR code
exports.verifyCardAndGetUserData = async (req, res) => {
  try {
    const { qrData } = req.body;

    // Only allow healthcare professionals to access this endpoint
    if (req.user.accountType !== 'Doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only healthcare professionals can access this information.'
      });
    }

    // Parse QR data
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code data'
      });
    }

    // Extract card ID from QR data
    const { cardId, userId, timestamp } = parsedData;

    if (!cardId) {
      return res.status(400).json({
        success: false,
        message: 'Card ID not found in QR code'
      });
    }

    // Check if QR code is expired (24 hours validity)
    const currentTime = new Date().getTime();
    const qrTimestamp = timestamp || 0;
    const timeDifference = currentTime - qrTimestamp;
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (timeDifference > oneDay) {
      return res.status(400).json({
        success: false,
        message: 'QR code has expired. Please ask the patient to generate a new one.'
      });
    }

    // Find user by card ID
    const user = await User.findOne({ 'arogyaNetraCard.cardId': cardId })
      .populate('additionalDetails')
      .select('-password -token -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this card ID'
      });
    }

    // Check if the user ID in QR matches the found user
    if (userId && userId !== user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Card verification failed. User ID mismatch.'
      });
    }

    // Log access for audit purposes
    console.log(`Healthcare professional ${req.user.firstName} ${req.user.lastName} (ID: ${req.user.id}) accessed patient data for ${user.firstName} ${user.lastName} (ID: ${user._id}) via QR code scan`);

    // Return user data
    return res.status(200).json({
      success: true,
      message: 'Card verified successfully',
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile_no: user.mobile_no,
          image: user.image,
          arogyaNetraCard: user.arogyaNetraCard
        },
        profile: user.additionalDetails,
        documents: user.documents
      }
    });

  } catch (error) {
    console.error('Error verifying card and getting user data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify card and get user data',
      error: error.message
    });
  }
};