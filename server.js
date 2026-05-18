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
// COMPRESS ROUTE
// ======================

app.post(
"/compress",
upload.single("video"),
(req, res) => {

// ======================    
// NO FILE    
// ======================    

if (!req.file) {    

  return res    
    .status(400)    
    .send("No video uploaded ❌");    

}    

console.log(    
  "Video upload received ✅"    
);    

const input = req.file.path;    

const fileName =    
  `compressed-${Date.now()}.mp4`;    

const output = path.join(    
  outputDir,    
  fileName    
);    

console.log(    
  "Compression started 🔥"    
);    

ffmpeg(input)    

  // ======================    
  // VIDEO SETTINGS    
  // ======================    

  .videoCodec("libx264")    

  .audioCodec("aac")    

  .size("720x?")    

  .outputOptions([    

    "-preset veryfast",    

    "-crf 32",    

    "-movflags +faststart"    

  ])    

  // ======================    
  // PROGRESS    
  // ======================    

  .on(    
    "progress",    
    (progress) => {    

      console.log(    

        `Compression Progress: ${    
          Math.floor(    
            progress.percent || 0    
          )    
        }%`    

      );    

    }    
  )    

  // ======================    
  // SUCCESS    
  // ======================    

  .on(    
    "end",    
    () => {    

      console.log(    
        "Compression completed 🎉"    
      );    

      /* DELETE INPUT ONLY */    

      if (    
        fs.existsSync(input)    
      ) {    

        fs.unlinkSync(input);    

      }    

      /* CREATE PUBLIC VIDEO URL */    

      const videoUrl =    
        `${req.protocol}://${req.get("host")}/outputs/${fileName}`;    

      console.log(    
        "Public Video URL:",    
        videoUrl    
      );    

      /* RETURN URL */    

      res.json({    
        videoUrl: videoUrl    
      });    

    }    
  )    

  // ======================    
  // ERROR    
  // ======================    

  .on(    
    "error",    
    (err) => {    

      console.log(    
        "Compression failed ❌"    
      );    

      console.log(err);    

      // CLEANUP    

      if (    
        fs.existsSync(input)    
      ) {    

        fs.unlinkSync(input);    

      }    

      if (    
        fs.existsSync(output)    
      ) {    

        fs.unlinkSync(output);    

      }    

      res    
        .status(500)    
        .send(    
          "Compression failed ❌"    
        );    

    }    
  )    

  // ======================    
  // SAVE    
  // ======================    

  .save(output);

}
);

// ======================
// SERVER START
// ======================

const PORT =
process.env.PORT || 3000;

app.listen(PORT, () => {

console.log(
"Primfed Server Running On Port " +
PORT +
" 🚀"
);

});
