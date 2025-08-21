const User = require('../models/User');
const Profile = require('../models/Profile');

// Get user by Arogya Netra Card ID
exports.getUserByCardId = async (req, res) => {
  try {
    const { cardId } = req.params;

    if (!cardId) {
      return res.status(400).json({
        success: false,
        message: 'Card ID is required'
      });
    }

    // Find the user by card ID
    const user = await User.findOne({ 'arogyaNetraCard.cardId': cardId }).populate("additionalDetails");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this card ID'
      });
    }

    // Return the user data
    return res.status(200).json({
      success: true,
      message: 'User found',
      user
    });
  } catch (error) {
    console.error('Error getting user by card ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user by card ID',
      error: error.message
    });
  }
};

// Update user profile with medical information
exports.updateMedicalProfile = async (req, res) => {
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
      medications
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
    if (dateOfBirth) profile.dateOfBirth = dateOfBirth;
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

    // Mark profile as complete and first login as false
    profile.isProfileComplete = true;
    profile.firstLogin = false;

    // Save profile
    await profile.save();

    // If this is a new profile, update user with profile ID
    if (!user.additionalDetails) {
      user.additionalDetails = profile._id;
      await user.save();
    }

    // Generate Arogya Netra Card ID if the user doesn't have one
    let cardDetails = null;
    if (!user.arogyaNetraCard || !user.arogyaNetraCard.cardId) {
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

      cardDetails = {
        cardId,
        issueDate,
        status: 'active'
      };
    } else {
      cardDetails = user.arogyaNetraCard;
    }

    return res.status(200).json({
      success: true,
      message: 'Medical profile updated successfully',
      profile,
      cardDetails
    });

  } catch (error) {
    console.error('Error updating medical profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update medical profile',
      error: error.message
    });
  }
};

// Check if user needs to complete profile
exports.checkProfileStatus = async (req, res) => {
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

    // If user is not a regular user, they don't need to complete the profile
    if (user.accountType !== 'User') {
      return res.status(200).json({
        success: true,
        needsProfileCompletion: false
      });
    }

    // Check if profile exists
    if (!user.additionalDetails) {
      return res.status(200).json({
        success: true,
        needsProfileCompletion: true
      });
    }

    // Check if this is the first login or if profile is incomplete
    const needsProfileCompletion =
      user.additionalDetails.firstLogin === true ||
      user.additionalDetails.isProfileComplete === false;

    return res.status(200).json({
      success: true,
      needsProfileCompletion,
      profile: user.additionalDetails
    });

  } catch (error) {
    console.error('Error checking profile status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check profile status',
      error: error.message
    });
  }
};