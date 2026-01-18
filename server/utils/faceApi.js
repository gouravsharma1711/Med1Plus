const faceapi = require('face-api.js');
const canvas = require('canvas');
const path = require('path');
const { Canvas, Image, ImageData } = canvas;

let tf = null;
let tfAvailable = false;

try {
  tf = require('@tensorflow/tfjs-node');
  tfAvailable = true;
  console.log('Using @tensorflow/tfjs-node backend');
} catch (e1) {
  try {
    tf = require('@tensorflow/tfjs');
    tfAvailable = true;
    console.warn('Using @tensorflow/tfjs (JS backend). Install @tensorflow/tfjs-node for better performance.');
  } catch (e2) {
    tf = null;
    tfAvailable = false;
    console.warn('TensorFlow backend not found.');
  }
}

// Monkey-patch face-api environment
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

if (tf) {
  try {
    faceapi.tf = tf;
  } catch (e) {
    console.warn('Could not set faceapi.tf:', e.message);
  }
}

const loadModels = async () => {
  const modelsPath = path.join(__dirname, '..', 'frmodels');
  try {
    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath);
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
    console.log('Face-api.js models loaded successfully.');
    return true;
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
    return false;
  }
};

module.exports = {
  faceapi,
  tf,
  tfAvailable,
  loadModels,
  canvas
};
