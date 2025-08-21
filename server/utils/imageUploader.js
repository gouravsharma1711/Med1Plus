const cloudinary = require('cloudinary').v2;  // Ensure you have cloudinary initialized

exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
    const options = {
        folder: folder,  // Cloudinary folder
        resource_type: 'auto',  // Auto-detect file type (image, video, pdf, etc.)
        access_control: [
            {
                access_type: 'anonymous',  // Ensure access type is anonymous
            }
        ]
    };

    // Optional fields: set height and quality if provided
    if (height) {
        options.height = height;
    }

    if (quality) {
        options.quality = quality;
    }

    try {
        const result = await cloudinary.uploader.upload(file.tempFilePath, options);
        return result;  // Return the result after uploading
    } catch (error) {
        console.error('Cloudinary upload failed:', error);
        throw new Error('Cloudinary upload failed');
    }
};


exports.deleteImageFromCloudinary=async(file,folder)=>{
    const options={folder};
    
    options.resource_type="auto";

    return await cloudinary.uploader.explicit(file.tempFilePath,options);
}