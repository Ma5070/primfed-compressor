const express =
require("express");

const multer =
require("multer");

const ffmpeg =
require("fluent-ffmpeg");

const cors =
require("cors");

const fs =
require("fs");

const app =
express();

app.use(cors({
origin:"*"
}));

app.get("/",(req,res)=>{

res.send(
"Primfed Compressor Running ✅"
);

});

const upload =
multer({
dest:"uploads/"
});

app.post(
"/compress",
upload.single("video"),
(req,res)=>{

if(!req.file){

return res.status(400)
.send("No file uploaded");

}

const input =
req.file.path;

const output =
`compressed-${Date.now()}.mp4`;

ffmpeg(input)

.videoCodec("libx264")

.size("720x?")

.outputOptions([
"-crf 32",
"-preset veryfast"
])

.save(output)

.on("end",()=>{

res.download(
output,
()=>{

fs.unlinkSync(input);

fs.unlinkSync(output);

}
);

})

.on("error",(err)=>{

console.log(err);

res.status(500)
.send("Compression failed");

});

}
);

const PORT =
process.env.PORT || 3000;

app.listen(PORT,()=>{

console.log(
"Server running on "+PORT
);

});
