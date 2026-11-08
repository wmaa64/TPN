// config/cloudinaryConfig.js
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
//import dotenv from 'dotenv';
import path from 'path';


//dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create storage engine for Multer and Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products', // Folder name in your Cloudinary storage
    allowedFormats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => {
      const orignalNameWithoutExt = path.basename(file.originalname, path.extname(file.originalname));
      return orignalNameWithoutExt;
    }
  },
});

// Initialize Multer with the Cloudinary storage engine
const upload = multer({ storage });

export { cloudinary, upload };
