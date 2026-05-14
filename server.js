const express = require("express");  
const multer = require("multer");  
const ffmpeg = require("fluent-ffmpeg");  
const cors = require("cors");  
const fs = require("fs");  
const path = require("path");  
  
const app = express();  
  
app.use(cors({  
  origin: "*"  
}));  
  
/* PUBLIC VIDEO ACCESS */  
app.use(  
  "/outputs",  
  express.static(  
    path.join(__dirname, "outputs")  
  )  
);  
  
// ======================  
// CREATE FOLDERS  
// ======================  
  
const uploadDir = path.join(__dirname, "uploads");  
const outputDir = path.join(__dirname, "outputs");  
  
if (!fs.existsSync(uploadDir)) {  
  fs.mkdirSync(uploadDir);  
}  
  
if (!fs.existsSync(outputDir)) {  
  fs.mkdirSync(outputDir);  
}  
  
// ======================  
// HOME ROUTE  
// ======================  
  
app.get("/", (req, res) => {  
  
  res.send("Primfed Compressor Running ✅");  
  
});  
  
// ======================  
// MULTER SETUP  
// ======================  
  
const upload = multer({  
  
  dest: uploadDir,  
  
  limits: {  
    fileSize: 100 * 1024 * 1024  
  },  
  
  fileFilter: (req, file, cb) => {  
  
    if (  
      file.mimetype.startsWith("video/")  
    ) {  
  
      cb(null, true);  
  
    } else {  
  
      cb(  
        new Error("Only videos allowed ❌"),  
        false  
      );  
  
    }  
  
  }  
  
});  
  
// ======================  
// COMPRESS ROUTE (ADAPTIVE ADDED ONLY)  
// ======================  
  
app.post(  
  "/compress",  
  upload.single("video"),  
  (req, res) => {  
  
    if (!req.file) {  
      return res  
        .status(400)  
        .send("No video uploaded ❌");  
    }  
  
    console.log("Video upload received ✅");  
  
    const input = req.file.path;  
  
    const baseName = `compressed-${Date.now()}`;  
  
    const low = path.join(outputDir, `${baseName}-480p.mp4`);  
    const mid = path.join(outputDir, `${baseName}-720p.mp4`);  
    const high = path.join(outputDir, `${baseName}-1080p.mp4`);  
  
    console.log("Compression started 🔥");  
  
    // ======================  
    // LOW QUALITY  
    // ======================  
    ffmpeg(input)  
      .videoCodec("libx264")  
      .audioCodec("aac")  
      .size("854x480")  
      .outputOptions([  
        "-preset medium",  
        "-crf 28",  
        "-b:v 600k",  
        "-maxrate 600k",  
        "-bufsize 1200k",  
        "-movflags +faststart",  
        "-pix_fmt yuv420p"  
      ])  
      .save(low);  
  
    // ======================  
    // MEDIUM QUALITY  
    // ======================  
    ffmpeg(input)  
      .videoCodec("libx264")  
      .audioCodec("aac")  
      .size("1280x720")  
      .outputOptions([  
        "-preset medium",  
        "-crf 26",  
        "-b:v 900k",  
        "-maxrate 900k",  
        "-bufsize 1800k",  
        "-movflags +faststart",  
        "-pix_fmt yuv420p",  
        "-profile:v main",  
        "-level 3.1",  
        "-b:a 128k"  
      ])  
      .save(mid);  
  
    // ======================  
    // HIGH QUALITY  
    // ======================  
    ffmpeg(input)  
      .videoCodec("libx264")  
      .audioCodec("aac")  
      .size("1920x1080")  
      .outputOptions([  
        "-preset slow",  
        "-crf 23",  
        "-b:v 2.5M",  
        "-maxrate 2.5M",  
        "-bufsize 5M",  
        "-movflags +faststart",  
        "-pix_fmt yuv420p"  
      ])  
      .save(high);  
  
    // ======================  
    // WAIT + RESPONSE  
    // ======================  
  
    setTimeout(() => {  
  
      if (fs.existsSync(input)) {  
        fs.unlinkSync(input);  
      }  
  
      const videoUrl = `${req.protocol}://${req.get("host")}/outputs/`;  
  
      console.log("Adaptive compression completed 🎉");  
  
      res.json({  
        low: videoUrl + `${baseName}-480p.mp4`,  
        medium: videoUrl + `${baseName}-720p.mp4`,  
        high: videoUrl + `${baseName}-1080p.mp4`  
      });  
  
    }, 9000);  
  
  }  
);  
  
// ======================  
// SERVER START  
// ======================  
  
const PORT = process.env.PORT || 3000;  
  
app.listen(PORT, () => {  
  
  console.log("Primfed Server Running On Port " + PORT + " 🚀");  
  
});
