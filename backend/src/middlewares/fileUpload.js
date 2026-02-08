/**
 * @file fileUpload.js
 * @description Middleware to handle image uploads using Multer.
 * We store files in 'memory' so we can pass them directly to Gemini.
 */

const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) =>{
    if(file.mimetype.startsWith('image/')){
        cb(null,true);
    }else{
        cb(new Error('Only image file are allowed'),false);
    }
};
const upload = multer ({
    storage:storage,
    fileFilter:fileFilter,
    limits:{fileSize: 5+1024*1024}  //max limit to 5 mb
});
module.exports = upload;
