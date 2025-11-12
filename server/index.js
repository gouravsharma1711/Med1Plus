const express = require("express");
const app = express();
// require('@tensorflow/tfjs-node');
const faceapi = require("face-api.js");
const userRoutes = require("./routes/User");
const uploadRoutes = require("./routes/Upload");

const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const { Canvas, Image } = require("canvas");
const canvas = require("canvas");

const User = require("./models/User");
const fs = require("fs").promises; // Use fs.promises for async/await
const { default: axios } = require("axios");

dotenv.config();
const PORT = process.env.PORT || 5000;

// Database connection
database.connect();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "*", credentials: true }));
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp" }));

cloudinaryConnect();

// Load Face-api.js models with SSD MobileNet for better accuracy
const loadModels = async () => {
  try {
    // Load both TinyFaceDetector (faster) and SSD MobileNet (more accurate)
    await faceapi.nets.tinyFaceDetector.loadFromDisk('./frmodels');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk('./frmodels');
    await faceapi.nets.faceLandmark68Net.loadFromDisk('./frmodels');
    await faceapi.nets.faceRecognitionNet.loadFromDisk('./frmodels');
    console.log('Face-api.js models loaded successfully.');
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
  }
};

loadModels().then(() => {
  console.log('Face recognition system initialized.');
});

// Optimized Image Loading Helper
const loadImageFromBuffer = async (imageBuffer) => {
  return new Promise((resolve, reject) => {
    const img = new canvas.Image();

    // Set a timeout to prevent hanging on corrupt images
    const timeout = setTimeout(() => {
      reject(new Error('Image loading timed out after 10 seconds'));
    }, 10000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(img);
    };

    img.onerror = (err) => {
      clearTimeout(timeout);
      reject(new Error(`Image load failed: ${err.message || 'Unknown error'}`));
    };

    img.src = imageBuffer;
  });
};

// Image URL cache to avoid refetching the same images
const imageCache = new Map();

// Fetch Image from URL with caching and optimized error handling
const fetchImage = async (imageUrl) => {
  try {
    // Check if image is already in cache
    if (imageCache.has(imageUrl)) {
      console.log(`Using cached image for URL: ${imageUrl.substring(0, 50)}...`);
      return imageCache.get(imageUrl);
    }

    console.time(`fetchImage_${imageUrl.substring(0, 20)}`);

    // Set timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      signal: controller.signal,
      timeout: 5000 // 5 second timeout
    });

    clearTimeout(timeoutId);

    const contentType = response.headers['content-type'];
    if (!contentType.startsWith('image/')) {
      throw new Error('The fetched URL is not an image.');
    }

    // Cache the image data
    imageCache.set(imageUrl, response.data);

    console.timeEnd(`fetchImage_${imageUrl.substring(0, 20)}`);
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
      throw new Error(`Image fetch timed out: ${imageUrl}`);
    }
    throw new Error(`Error fetching image from URL: ${error.message}`);
  }
};

// POST API endpoint for face recognition
const DB_QUERY_TIMEOUT = 5000; // 5 seconds for the database query to complete
const IMAGE_LOAD_TIMEOUT = 10000; // 10 seconds for the image load timeout

// app.post('/api/v1/recognize', async (req, res) => {
//   try {
//     if (!req.files || !req.files.photo) {
//       return res.status(400).send('No image file provided.');
//     }

//     const image = req.files.photo;
//     const filePath = image.tempFilePath;

//     try {
//       const data = await fs.readFile(filePath);

//       const img = await loadImageFromBuffer(data);

//       const nodeCanvas = canvas.createCanvas(img.width, img.height);
//       const ctx = nodeCanvas.getContext('2d');
//       ctx.drawImage(img, 0, 0, img.width, img.height);

//       const tensor = faceapi.tf.browser.fromPixels(nodeCanvas);
//       const detection = await faceapi.detectSingleFace(tensor, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

//       if (!detection) {
//         return res.status(404).send('No face detected in the provided image.');
//       }

//       const detectedDescriptor = detection.descriptor;

//       // Fetch users with face descriptors precomputed in the DB (or cache)
//       const users = await User.find().exec();

//       if (!users || users.length === 0) {
//         return res.status(404).send('No users found in the database.');
//       }

//       const userPromises = users.map(async (user) => {
//         try {
//           const imageBuffer = await fetchImage(user.image);
//           const loadedImage = await loadImageFromBuffer(imageBuffer);

//           const dbCanvas = canvas.createCanvas(loadedImage.width, loadedImage.height);
//           const dbCtx = dbCanvas.getContext("2d");
//           dbCtx.drawImage(loadedImage, 0, 0, loadedImage.width, loadedImage.height);

//           const dbTensor = faceapi.tf.browser.fromPixels(dbCanvas);
//           const dbDetection = await faceapi.detectSingleFace(dbTensor, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

//           if (dbDetection) {
//             const dbDescriptor = dbDetection.descriptor;
//             const distance = faceapi.euclideanDistance(detectedDescriptor, dbDescriptor);

//             // Optimized threshold for recognizing faces
//             if (distance < 0.6) {
//               return user; // Match found
//             }
//           }
//         } catch (error) {
//           console.error(`Error processing user image ${user._id}:`, error);
//         }
//         return null;
//       });

//       // Get the matched user
//       const matchedUser = (await Promise.all(userPromises)).find(user => user !== null);

//       if (matchedUser) {
//         return res.json({
//           message: 'User found',
//           user: matchedUser,
//         });
//       } else {
//         return res.status(404).send('No matching face found.');
//       }
//     } catch (error) {
//       return res.status(500).send('Error during face recognition: ' + error.message);
//     }
//   } catch (error) {
//     return res.status(500).send('Error during face recognition: ' + error.message);
//   }
// });





// Enhanced face recognition endpoint with better accuracy and performance
app.post('/api/v1/recognize', async (req, res) => {
  console.time('faceRecognitionTotal');
  try {
    if (!req.files || !req.files.photo) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided.'
      });
    }

    const image = req.files.photo;
    const filePath = image.tempFilePath;

    console.time('imageProcessing');
    // Read the image file
    const data = await fs.readFile(filePath);

    // Optimize image size before processing - use smaller size for faster processing
    const img = await loadImageFromBuffer(data);

    // Resize large images for faster processing - reduced from 1024 to 640
    const MAX_SIZE = 640; // Maximum dimension for processing
    let width = img.width;
    let height = img.height;

    if (width > MAX_SIZE || height > MAX_SIZE) {
      console.log(`Resizing image from ${width}x${height} for faster processing`);
      if (width > height) {
        height = Math.floor(height * (MAX_SIZE / width));
        width = MAX_SIZE;
      } else {
        width = Math.floor(width * (MAX_SIZE / height));
        height = MAX_SIZE;
      }
    }

    // Create canvas and draw image
    const nodeCanvas = canvas.createCanvas(width, height);
    const ctx = nodeCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    console.timeEnd('imageProcessing');

    console.time('faceDetection');
    // Use SSD MobileNet first for better accuracy
    const tensor = faceapi.tf.browser.fromPixels(nodeCanvas);
    let detection = await faceapi.detectSingleFace(tensor, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptor();

    // If no face detected with SSD MobileNet, try with TinyFaceDetector as fallback
    if (!detection) {
      console.log('No face detected with SSD MobileNet, trying TinyFaceDetector as fallback...');
      detection = await faceapi.detectSingleFace(tensor, new faceapi.TinyFaceDetectorOptions({
        scoreThreshold: 0.3 // Lower threshold to detect more faces
      })).withFaceLandmarks().withFaceDescriptor();
    }
    console.timeEnd('faceDetection');

    if (!detection) {
      console.timeEnd('faceRecognitionTotal');
      return res.status(404).json({
        success: false,
        message: 'No face detected in the provided image. Please ensure your face is clearly visible and well-lit.'
      });
    }

    console.log('Face detected successfully in uploaded image');
    const detectedDescriptor = detection.descriptor;

    // Check if we have enough descriptors in cache before querying the database
    console.log(`Current descriptor cache size: ${faceDescriptorCache.size}`);

    // If cache is empty or has very few entries, preload some descriptors
    if (faceDescriptorCache.size < 5) {
      console.log('Face descriptor cache is empty or has few entries, preloading some descriptors...');

      // Fetch a limited number of users to precompute descriptors
      const sampleUsers = await User.find({}, 'firstName lastName image _id')
        .limit(20) // Limit to 20 users for quick startup
        .exec();

      // Precompute descriptors for these users in the background
      setTimeout(async () => {
        try {
          for (const user of sampleUsers) {
            if (user.image && !faceDescriptorCache.has(`descriptor_${user._id}`)) {
              try {
                const imageBuffer = await fetchImage(user.image);
                const loadedImage = await loadImageFromBuffer(imageBuffer);

                const MAX_SIZE = 480;
                let width = loadedImage.width;
                let height = loadedImage.height;

                if (width > MAX_SIZE || height > MAX_SIZE) {
                  if (width > height) {
                    height = Math.floor(height * (MAX_SIZE / width));
                    width = MAX_SIZE;
                  } else {
                    width = Math.floor(width * (MAX_SIZE / height));
                    height = MAX_SIZE;
                  }
                }

                const dbCanvas = canvas.createCanvas(width, height);
                const dbCtx = dbCanvas.getContext("2d");
                dbCtx.drawImage(loadedImage, 0, 0, width, height);

                const dbTensor = faceapi.tf.browser.fromPixels(dbCanvas);
                // Use SSD MobileNet for better accuracy during preloading
                const dbDetection = await faceapi.detectSingleFace(dbTensor, new faceapi.SsdMobilenetv1Options())
                  .withFaceLandmarks()
                  .withFaceDescriptor();

                if (dbDetection) {
                  faceDescriptorCache.set(`descriptor_${user._id}`, dbDetection.descriptor);
                }
              } catch (error) {
                console.error(`Error precomputing descriptor for user ${user._id}:`, error.message);
              }
            }
          }
          console.log(`Precomputed ${faceDescriptorCache.size} descriptors in background`);
        } catch (error) {
          console.error('Error in background descriptor precomputation:', error);
        }
      }, 0);
    }

    console.time('fetchUsers');
    // Fetch only necessary user fields to reduce data transfer
    const users = await User.find({}, 'firstName lastName email mobile_no image additionalDetails documents accountType')
      .lean() // Use lean() for faster query execution with plain JS objects
      .exec();
    console.timeEnd('fetchUsers');

    if (!users || users.length === 0) {
      console.timeEnd('faceRecognitionTotal');
      return res.status(404).json({
        success: false,
        message: 'No users found in the database.'
      });
    }

    console.log(`Comparing face with ${users.length} users in database...`);

    console.time('findMatch');
    const matchedUser = await findMatchingUser(users, detectedDescriptor);
    console.timeEnd('findMatch');

    if (matchedUser) {
      console.log(`Match found: User ${matchedUser._id} (${matchedUser.firstName} ${matchedUser.lastName})`);
      console.timeEnd('faceRecognitionTotal');

      // Return only necessary user data to reduce response size
      return res.json({
        success: true,
        message: 'User found',
        user: {
          _id: matchedUser._id,
          firstName: matchedUser.firstName,
          lastName: matchedUser.lastName,
          email: matchedUser.email,
          mobile_no: matchedUser.mobile_no,
          accountType: matchedUser.accountType,
          image: matchedUser.image,
          documents: matchedUser.documents,
          additionalDetails: matchedUser.additionalDetails
        }
      });
    } else {
      console.log('No matching face found in database');
      console.timeEnd('faceRecognitionTotal');
      return res.status(404).json({
        success: false,
        message: 'No matching face found. Please try again or register if you are a new user.'
      });
    }
  } catch (error) {
    console.error('Face recognition error:', error);
    console.timeEnd('faceRecognitionTotal');
    return res.status(500).json({
      success: false,
      message: 'Error during face recognition: ' + error.message
    });
  } finally {
    // Clean up temporary files
    if (req.files && req.files.photo && req.files.photo.tempFilePath) {
      try {
        await fs.unlink(req.files.photo.tempFilePath).catch(err => console.error('Error deleting temp file:', err));
      } catch (err) {
        console.error('Error cleaning up temporary files:', err);
      }
    }
  }
});

// Cache for storing face descriptors to avoid reprocessing images
const faceDescriptorCache = new Map();

// Enhanced helper function to find matching user with better accuracy and performance
async function findMatchingUser(users, detectedDescriptor) {
  try {
    console.time('findMatchingUser'); // Start timing the function execution

    // Populate user details in a single query to reduce database load
    const populatedUsers = await User.populate(users, { path: 'additionalDetails' });
    console.log(`Processing ${populatedUsers.length} users for face matching`);

    // Store matches with their distances for better selection
    const matches = [];

    // First pass: Check for exact matches using cached descriptors (extremely fast)
    console.time('firstPassMatching');
    for (const user of populatedUsers) {
      if (!user.image) continue;

      // Check if we have a cached descriptor for this user
      const cacheKey = `descriptor_${user._id}`;
      if (faceDescriptorCache.has(cacheKey)) {
        const cachedDescriptor = faceDescriptorCache.get(cacheKey);
        const distance = faceapi.euclideanDistance(detectedDescriptor, cachedDescriptor);

        // Store all matches for comparison - don't return early to ensure we find the best match
        matches.push({ user, distance, source: 'cache' });

        // Log the distance for debugging
        console.log(`Cache match for user ${user._id} (${user.firstName} ${user.lastName}): distance = ${distance}`);
      }
    }
    console.timeEnd('firstPassMatching');

    // Process users in batches for better throughput
    const BATCH_SIZE = 5; // Reduced batch size for more accurate processing
    const batches = [];

    // Create batches of users, prioritizing users without cached descriptors
    const usersWithoutCache = populatedUsers.filter(user =>
      user.image && !faceDescriptorCache.has(`descriptor_${user._id}`)
    );

    console.log(`${usersWithoutCache.length} users need descriptor calculation`);

    for (let i = 0; i < usersWithoutCache.length; i += BATCH_SIZE) {
      batches.push(usersWithoutCache.slice(i, i + BATCH_SIZE));
    }

    console.log(`Processing users in ${batches.length} batches of ${BATCH_SIZE}`);

    // Process each batch in parallel with optimized processing
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length}`);

      // Process users in the current batch in parallel
      const batchPromises = batch.map(async (user) => {
        try {
          // Skip users without profile images
          if (!user.image) {
            return null;
          }

          console.time(`processUser_${user._id}`);

          // Fetch and process the user's profile image
          const imageBuffer = await fetchImage(user.image);
          const loadedImage = await loadImageFromBuffer(imageBuffer);

          // Use larger image size for better accuracy
          const MAX_SIZE = 640; // Increased from 480 to 640 for better accuracy
          let width = loadedImage.width;
          let height = loadedImage.height;

          // Scale down large images for processing
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.floor(height * (MAX_SIZE / width));
              width = MAX_SIZE;
            } else {
              width = Math.floor(width * (MAX_SIZE / height));
              height = MAX_SIZE;
            }
          }

          const dbCanvas = canvas.createCanvas(width, height);
          const dbCtx = dbCanvas.getContext("2d");
          dbCtx.drawImage(loadedImage, 0, 0, width, height);

          // Try SSD MobileNet first for better accuracy
          const dbTensor = faceapi.tf.browser.fromPixels(dbCanvas);
          let dbDetection = await faceapi.detectSingleFace(dbTensor, new faceapi.SsdMobilenetv1Options())
            .withFaceLandmarks()
            .withFaceDescriptor();

          // If no face detected with SSD MobileNet, try with TinyFaceDetector
          if (!dbDetection) {
            dbDetection = await faceapi.detectSingleFace(dbTensor, new faceapi.TinyFaceDetectorOptions({
              scoreThreshold: 0.3
            })).withFaceLandmarks().withFaceDescriptor();
          }

          if (dbDetection) {
            const dbDescriptor = dbDetection.descriptor;

            // Cache the descriptor for future use
            faceDescriptorCache.set(`descriptor_${user._id}`, dbDescriptor);

            const distance = faceapi.euclideanDistance(detectedDescriptor, dbDescriptor);

            // Store all matches for comparison
            matches.push({ user, distance, source: 'fresh' });

            // Log the distance for debugging
            console.log(`Fresh match for user ${user._id} (${user.firstName} ${user.lastName}): distance = ${distance}`);
          } else {
            console.log(`No face detected in profile image for user ${user._id}`);
          }

          console.timeEnd(`processUser_${user._id}`);
          return null;
        } catch (error) {
          console.error(`Error processing user image ${user._id}:`, error);
          return null;
        }
      });

      // Wait for all promises in this batch to complete
      await Promise.all(batchPromises);
    }

    // Sort matches by distance (lowest/best match first)
    matches.sort((a, b) => a.distance - b.distance);

    // Log all potential matches for debugging
    if (matches.length > 0) {
      console.log('Potential matches found:');
      matches.slice(0, 5).forEach((match, index) => {
        console.log(`${index + 1}. User: ${match.user.firstName} ${match.user.lastName}, Distance: ${match.distance}, Source: ${match.source}`);
      });

      // Use a stricter threshold for better accuracy
      if (matches[0].distance < 0.45) { // Very strict threshold for high confidence
        console.log(`High confidence match selected: ${matches[0].user.firstName} ${matches[0].user.lastName} with distance ${matches[0].distance}`);
        console.timeEnd('findMatchingUser');
        return matches[0].user;
      } else if (matches[0].distance < 0.55) { // Medium confidence threshold
        console.log(`Medium confidence match selected: ${matches[0].user.firstName} ${matches[0].user.lastName} with distance ${matches[0].distance}`);
        console.timeEnd('findMatchingUser');
        return matches[0].user;
      } else if (matches.length >= 2) {
        // Check if the best match is significantly better than the second best
        const ratio = matches[1].distance / matches[0].distance;
        if (matches[0].distance < 0.6 && ratio > 1.2) {
          console.log(`Selected match based on significant difference from next best: ${matches[0].user.firstName} ${matches[0].user.lastName} with distance ${matches[0].distance} (ratio: ${ratio.toFixed(2)})`);
          console.timeEnd('findMatchingUser');
          return matches[0].user;
        } else {
          console.log(`No confident match found. Best: ${matches[0].distance}, Second best: ${matches[1].distance}, Ratio: ${ratio.toFixed(2)}`);
        }
      }
    }

    console.log('No matches found within acceptable threshold');
    console.timeEnd('findMatchingUser');
    return null;
  } catch (error) {
    console.error('Error in findMatchingUser:', error);
    return null;
  }
}


// Preload user images and compute face descriptors for faster recognition
app.get('/api/v1/preload-user-images', async (req, res) => {
  try {
    console.log('Preloading user images and computing face descriptors...');
    const users = await User.find({}, 'firstName lastName image _id').exec();

    let loadedCount = 0;
    let descriptorsComputed = 0;
    let errorCount = 0;

    // Process in larger batches for better throughput
    const BATCH_SIZE = 10;
    const batches = [];

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      batches.push(users.slice(i, i + BATCH_SIZE));
    }

    console.log(`Processing ${users.length} users in ${batches.length} batches of ${BATCH_SIZE}`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length}`);

      await Promise.all(batch.map(async (user) => {
        if (user.image) {
          try {
            // Check if we already have this descriptor cached
            const cacheKey = `descriptor_${user._id}`;
            if (faceDescriptorCache.has(cacheKey)) {
              console.log(`Using cached descriptor for user ${user._id}`);
              loadedCount++;
              descriptorsComputed++;
              return;
            }

            // Fetch and process the user's profile image
            const imageBuffer = await fetchImage(user.image);
            loadedCount++;

            // Process the image to extract face descriptor
            const loadedImage = await loadImageFromBuffer(imageBuffer);

            // Create a smaller canvas for faster processing
            const MAX_SIZE = 480;
            let width = loadedImage.width;
            let height = loadedImage.height;

            if (width > MAX_SIZE || height > MAX_SIZE) {
              if (width > height) {
                height = Math.floor(height * (MAX_SIZE / width));
                width = MAX_SIZE;
              } else {
                width = Math.floor(width * (MAX_SIZE / height));
                height = MAX_SIZE;
              }
            }

            const dbCanvas = canvas.createCanvas(width, height);
            const dbCtx = dbCanvas.getContext("2d");
            dbCtx.drawImage(loadedImage, 0, 0, width, height);

            // Try with TinyFaceDetector first (faster)
            const dbTensor = faceapi.tf.browser.fromPixels(dbCanvas);
            let dbDetection = await faceapi.detectSingleFace(dbTensor, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptor();

            // If no face detected, try with SSD MobileNet
            if (!dbDetection) {
              dbDetection = await faceapi.detectSingleFace(dbTensor, new faceapi.SsdMobilenetv1Options())
                .withFaceLandmarks()
                .withFaceDescriptor();
            }

            if (dbDetection) {
              // Cache the descriptor for future use
              faceDescriptorCache.set(cacheKey, dbDetection.descriptor);
              descriptorsComputed++;
              console.log(`Computed and cached face descriptor for user ${user._id} (${user.firstName} ${user.lastName})`);
            } else {
              console.log(`No face detected in profile image for user ${user._id} (${user.firstName} ${user.lastName})`);
            }
          } catch (error) {
            console.error(`Error processing image for user ${user._id}:`, error.message);
            errorCount++;
          }
        }
      }));

      // Send progress updates for long-running operations
      if (batchIndex % 5 === 0 && batchIndex > 0) {
        console.log(`Progress update: Processed ${batchIndex * BATCH_SIZE}/${users.length} users`);
      }
    }

    // Cache size management - if we have too many descriptors, we might want to persist them
    console.log(`Face descriptor cache size: ${faceDescriptorCache.size} entries`);

    return res.json({
      success: true,
      message: `Preloaded ${loadedCount} user images and computed ${descriptorsComputed} face descriptors (${errorCount} errors)`,
      loadedCount,
      descriptorsComputed,
      errorCount,
      totalUsers: users.length,
      cacheSize: faceDescriptorCache.size
    });
  } catch (error) {
    console.error('Error preloading user data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error preloading user data: ' + error.message
    });
  }
});

// Endpoint to get cache statistics and manage the descriptor cache
app.get('/api/v1/face-recognition-stats', (req, res) => {
  return res.json({
    success: true,
    cacheSize: faceDescriptorCache.size,
    imagesCached: imageCache.size,
    message: "Face recognition system statistics"
  });
});

// Endpoint to clear the descriptor cache (useful for testing or when updating user images)
app.post('/api/v1/clear-face-cache', (req, res) => {
  const oldSize = faceDescriptorCache.size;
  faceDescriptorCache.clear();
  return res.json({
    success: true,
    message: `Cleared ${oldSize} entries from face descriptor cache`
  });
});

// Endpoint to test face recognition with different thresholds (for accuracy tuning)
app.post('/api/v1/test-recognition', async (req, res) => {
  try {
    if (!req.files || !req.files.photo) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided.'
      });
    }

    if (!req.body.userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a userId to compare against'
      });
    }

    const image = req.files.photo;
    const filePath = image.tempFilePath;
    const userId = req.body.userId;

    // Read the image file
    const data = await fs.readFile(filePath);
    const img = await loadImageFromBuffer(data);

    // Create canvas and draw image
    const nodeCanvas = canvas.createCanvas(img.width, img.height);
    const ctx = nodeCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);

    // Use SSD MobileNet for better accuracy
    const tensor = faceapi.tf.browser.fromPixels(nodeCanvas);
    const detection = await faceapi.detectSingleFace(tensor, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'No face detected in the provided image.'
      });
    }

    // Get the user to compare against
    const user = await User.findById(userId);
    if (!user || !user.image) {
      return res.status(404).json({
        success: false,
        message: 'User not found or has no profile image'
      });
    }

    // Get the user's face descriptor
    let userDescriptor;
    const cacheKey = `descriptor_${user._id}`;

    // Check if we have a cached descriptor
    if (faceDescriptorCache.has(cacheKey)) {
      userDescriptor = faceDescriptorCache.get(cacheKey);
    } else {
      // Process the user's image to get a descriptor
      const imageBuffer = await fetchImage(user.image);
      const loadedImage = await loadImageFromBuffer(imageBuffer);

      const dbCanvas = canvas.createCanvas(loadedImage.width, loadedImage.height);
      const dbCtx = dbCanvas.getContext("2d");
      dbCtx.drawImage(loadedImage, 0, 0, loadedImage.width, loadedImage.height);

      const dbTensor = faceapi.tf.browser.fromPixels(dbCanvas);
      const dbDetection = await faceapi.detectSingleFace(dbTensor, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!dbDetection) {
        return res.status(404).json({
          success: false,
          message: 'No face detected in the user\'s profile image'
        });
      }

      userDescriptor = dbDetection.descriptor;
      faceDescriptorCache.set(cacheKey, userDescriptor);
    }

    // Calculate the distance between the two face descriptors
    const distance = faceapi.euclideanDistance(detection.descriptor, userDescriptor);

    // Return detailed information about the match
    return res.json({
      success: true,
      distance: distance,
      thresholdAnalysis: {
        veryStrict: { threshold: 0.4, match: distance < 0.4 },
        strict: { threshold: 0.5, match: distance < 0.5 },
        moderate: { threshold: 0.6, match: distance < 0.6 },
        lenient: { threshold: 0.7, match: distance < 0.7 }
      },
      recommendation: distance < 0.5 ? 'High confidence match' :
                      distance < 0.6 ? 'Moderate confidence match' :
                      distance < 0.7 ? 'Low confidence match' : 'Not a match'
    });
  } catch (error) {
    console.error('Error in test recognition:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during test recognition: ' + error.message
    });
  } finally {
    // Clean up temporary files
    if (req.files && req.files.photo && req.files.photo.tempFilePath) {
      try {
        await fs.unlink(req.files.photo.tempFilePath).catch(err => console.error('Error deleting temp file:', err));
      } catch (err) {
        console.error('Error cleaning up temporary files:', err);
      }
    }
  }
});

// Endpoint to refresh descriptors for specific users
app.post('/api/v1/refresh-user-descriptors', async (req, res) => {
  try {
    if (!req.body || !req.body.userIds || !Array.isArray(req.body.userIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs to refresh'
      });
    }

    const userIds = req.body.userIds;
    const users = await User.find({ _id: { $in: userIds } }, 'firstName lastName image _id').exec();

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found with the provided IDs'
      });
    }

    let refreshedCount = 0;
    let errorCount = 0;

    await Promise.all(users.map(async (user) => {
      if (user.image) {
        try {
          // Remove from cache if exists
          const cacheKey = `descriptor_${user._id}`;
          faceDescriptorCache.delete(cacheKey);

          // Fetch and reprocess
          const imageBuffer = await fetchImage(user.image);
          const loadedImage = await loadImageFromBuffer(imageBuffer);

          const MAX_SIZE = 480;
          let width = loadedImage.width;
          let height = loadedImage.height;

          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.floor(height * (MAX_SIZE / width));
              width = MAX_SIZE;
            } else {
              width = Math.floor(width * (MAX_SIZE / height));
              height = MAX_SIZE;
            }
          }

          const dbCanvas = canvas.createCanvas(width, height);
          const dbCtx = dbCanvas.getContext("2d");
          dbCtx.drawImage(loadedImage, 0, 0, width, height);

          const dbTensor = faceapi.tf.browser.fromPixels(dbCanvas);
          // Use SSD MobileNet for better accuracy
          let dbDetection = await faceapi.detectSingleFace(dbTensor, new faceapi.SsdMobilenetv1Options())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!dbDetection) {
            dbDetection = await faceapi.detectSingleFace(dbTensor, new faceapi.SsdMobilenetv1Options())
              .withFaceLandmarks()
              .withFaceDescriptor();
          }

          if (dbDetection) {
            faceDescriptorCache.set(cacheKey, dbDetection.descriptor);
            refreshedCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error refreshing descriptor for user ${user._id}:`, error);
          errorCount++;
        }
      }
    }));

    return res.json({
      success: true,
      message: `Refreshed ${refreshedCount} user descriptors (${errorCount} errors)`,
      refreshedCount,
      errorCount,
      totalRequested: userIds.length
    });
  } catch (error) {
    console.error('Error refreshing user descriptors:', error);
    return res.status(500).json({
      success: false,
      message: 'Error refreshing user descriptors: ' + error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`App is running at ${PORT}`);

  // Automatically preload some face descriptors on server start
  setTimeout(async () => {
    try {
      console.log('Preloading initial face descriptors...');
      const sampleUsers = await User.find({}, 'image _id')
        .limit(20) // Start with a small batch
        .exec();

      let loadedCount = 0;

      for (const user of sampleUsers) {
        if (user.image && !faceDescriptorCache.has(`descriptor_${user._id}`)) {
          try {
            const imageBuffer = await fetchImage(user.image);
            const loadedImage = await loadImageFromBuffer(imageBuffer);

            const MAX_SIZE = 480;
            let width = loadedImage.width;
            let height = loadedImage.height;

            if (width > MAX_SIZE || height > MAX_SIZE) {
              if (width > height) {
                height = Math.floor(height * (MAX_SIZE / width));
                width = MAX_SIZE;
              } else {
                width = Math.floor(width * (MAX_SIZE / height));
                height = MAX_SIZE;
              }
            }

            const dbCanvas = canvas.createCanvas(width, height);
            const dbCtx = dbCanvas.getContext("2d");
            dbCtx.drawImage(loadedImage, 0, 0, width, height);

            const dbTensor = faceapi.tf.browser.fromPixels(dbCanvas);
            // Use SSD MobileNet for better accuracy
            const dbDetection = await faceapi.detectSingleFace(dbTensor, new faceapi.SsdMobilenetv1Options())
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (dbDetection) {
              faceDescriptorCache.set(`descriptor_${user._id}`, dbDetection.descriptor);
              loadedCount++;
            }
          } catch (error) {
            console.error(`Error preloading descriptor for user ${user._id}:`, error.message);
          }
        }
      }

      console.log(`Preloaded ${loadedCount} face descriptors on server start`);
    } catch (error) {
      console.error('Error preloading initial face descriptors:', error);
    }
  }, 5000); // Wait 5 seconds after server start to begin preloading
});

// Routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/user", uploadRoutes);

// Default route
app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Your server is up and running...."
  });
});