const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors({ origin: "*" }));

// ======================
// STATIC FILE ACCESS
// ======================
app.use(
  "/outputs",
  express.static(path.join(__dirname, "outputs"))
);

// ======================
// FOLDERS
// ======================
const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "outputs");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// ======================
// MULTER
// ======================
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only videos allowed ❌"), false);
    }
  }
});

// ======================
// HOME
// ======================
app.get("/", (req, res) => {
  res.send("Primfed HLS Server Running 🚀");
});

// ======================
// HLS COMPRESS ROUTE
// ======================
app.post("/compress", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No video uploaded ❌");
  }

  console.log("Video upload received ✅");

  const input = req.file.path;

  // ======================
  // CREATE HLS FOLDER
  // ======================
  const folderName = `video-${Date.now()}`;

  const hlsDir = path.join(outputDir, folderName);
  if (!fs.existsSync(hlsDir)) {
    fs.mkdirSync(hlsDir, { recursive: true });
  }

  const playlistPath = path.join(hlsDir, "playlist.m3u8");

  console.log("HLS conversion started 🔥");

  // ======================
  // FFmpeg HLS
  // ======================
  ffmpeg(input)

    .videoCodec("libx264")
    .audioCodec("aac")

    .outputOptions([

      "-preset veryfast",
      "-crf 29",

      "-b:a 96k",

      "-movflags +faststart",

      "-hls_time 3",
      "-hls_list_size 0",

      "-hls_segment_filename",
      path.join(hlsDir, "segment%03d.ts"),

      "-f hls"
    ])

    .output(playlistPath)

    .on("progress", (progress) => {
      console.log(
        `Processing: ${Math.floor(progress.percent || 0)}%`
      );
    })

    .on("end", () => {

      console.log("HLS conversion completed 🎉");

      // delete uploaded file
      if (fs.existsSync(input)) {
        fs.unlinkSync(input);
      }

      const videoUrl =
        `${req.protocol}://${req.get("host")}` +
        `/outputs/${folderName}/playlist.m3u8`;

      console.log("HLS URL:", videoUrl);

      res.json({
        success: true,
        videoUrl
      });
    })

    .on("error", (err) => {

      console.log("HLS conversion failed ❌", err);

      if (fs.existsSync(input)) {
        fs.unlinkSync(input);
      }

      res.status(500).send("Compression failed ❌");
    })

    .run();
});

// ======================
// SERVER START
// ======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Primfed Server Running On Port " + PORT + " 🚀");
});
