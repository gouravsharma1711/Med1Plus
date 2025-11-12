
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const moment = require('moment');
const fs = require('fs');

// Upload a document for the user
const uploadFiles = async (req, res) => {
  try {
    const userId = req.params.userId; // User ID from URL
    const files = req.files; // Assuming files come from a form with multipart/form-data (via multer or similar)
    const { categories } = req.body; // Get categories from request body

    console.log(files);
    // Get today's date to organize the folder
    const folderName = moment().format('YYYY-MM-DD');
    const fileUrls = [];

    // Upload files to Cloudinary
    if(Array.isArray(files.files)){
        for (let i = 0; i < files.files.length; i++) {
          const file = files.files[i];
          const uploadedFile = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: `uploads/${folderName}`,
            resource_type: 'auto', // Automatically determine the file type (image, pdf, etc.)
          });
          // Get category for this file (if provided)
          let category = "other";
          if (categories && Array.isArray(categories) && categories[i]) {
            category = categories[i];
          } else if (categories && typeof categories === 'string') {
            category = categories;
          }

          // Add the uploaded file info to the fileUrls array
          fileUrls.push({
            fileName: file.name,
            fileUrl: uploadedFile.secure_url,
            fileSize: file.size,
            fileType: file.mimetype,
            category: category
          });
        }
    }
    else{
        // Handle single file upload (if only one file is uploaded)
      const file = files.files;
      const uploadedFile = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: `uploads/${folderName}`,
        resource_type: 'auto',
      });

      // Get category for this file
      let category = "other";
      if (categories && typeof categories === 'string') {
        category = categories;
      }

      fileUrls.push({
        fileName: file.name,
        fileUrl: uploadedFile.secure_url,
        fileSize: file.size,
        fileType: file.mimetype,
        category: category
      });
    }

    // Find the user and update their documents array
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          documents: {
            $each: fileUrls,
          },
        },
      },
      { new: true }
    );

    console.log(updatedUser)

    res.status(200).json({ message: 'Documents uploaded successfully!', updatedUser });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ message: 'Error uploading documents', error: error.message });
  }
};

// Get all documents for a user
const getUserDocuments = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select('documents');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Group documents by category for better organization
    const documentsByCategory = {
      prescription: [],
      medical_report: [],
      lab_result: [],
      other: []
    };

    // Organize documents by category
    user.documents.forEach(doc => {
      const category = doc.category || 'other';
      if (documentsByCategory[category]) {
        documentsByCategory[category].push(doc);
      } else {
        documentsByCategory.other.push(doc);
      }
    });

    res.status(200).json({
      message: 'User documents retrieved successfully',
      documents: user.documents,
      documentsByCategory: documentsByCategory
    });
  } catch (error) {
    console.error('Error retrieving documents:', error);
    res.status(500).json({ message: 'Error retrieving documents', error: error.message });
  }
};

// Delete a document (optional)
const deleteDocument = async (req, res) => {
  try {
    const userId = req.params.userId;
    const documentId = req.params.documentId; // Document ID from URL

    // Find the user and remove the document
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { documents: { _id: documentId } } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Group documents by category for better organization
    const documentsByCategory = {
      prescription: [],
      medical_report: [],
      lab_result: [],
      other: []
    };

    // Organize documents by category
    updatedUser.documents.forEach(doc => {
      const category = doc.category || 'other';
      if (documentsByCategory[category]) {
        documentsByCategory[category].push(doc);
      } else {
        documentsByCategory.other.push(doc);
      }
    });

    res.status(200).json({
      message: 'Document deleted successfully',
      updatedUser,
      documentsByCategory: documentsByCategory
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
};


// Export controller functions
module.exports = {
//   createUser,
  uploadFiles,
  getUserDocuments,
  deleteDocument,
};
