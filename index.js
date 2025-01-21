import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

const server = express();
const uploadDir = './uploads'; // Directory to store uploaded videos

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

server.use(express.static('public')); // Serve static files
server.use(express.json());

let streamProcess = null;

// Endpoint for video upload
server.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: 'No file uploaded!' });
  }

  res.send({ message: 'File uploaded successfully!', filePath: req.file.filename });
});

// Endpoint to list uploaded videos
server.get('/videos', (req, res) => {
  const files = fs.readdirSync(uploadDir).map(file => ({
    name: file,
    path: path.join(uploadDir, file)
  }));
  res.send(files);
});

// Endpoint to delete an uploaded video
server.delete('/videos/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadDir, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.send({ message: 'Video deleted successfully!' });
  } else {
    res.status(404).send({ error: 'File not found!' });
  }
});

// Start streaming
server.post('/start-stream', (req, res) => {
  const { streamkey, video } = req.body;

  if (!video) {
    return res.status(400).send({ error: 'Video file is required!' });
  }

  const filePath = path.join(uploadDir, video);
  if (!fs.existsSync(filePath)) {
    return res.status(400).send({ error: 'Video file not found!' });
  }

  const ffmpegCommand = [
    'ffmpeg',
    '-re',
    '-i', filePath, // Video file
    '-vcodec', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'ultrafast',
    '-maxrate', '3000k',
    '-bufsize', '6000k',
    '-g', '50',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'flv',
    `rtmp://a.rtmp.youtube.com/live2/${streamkey}`
  ];

  // Start streaming with ffmpeg
  streamProcess = spawn(ffmpegCommand[0], ffmpegCommand.slice(1));

  streamProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  streamProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  streamProcess.on('close', (code) => {
    console.log(`Stream process exited with code ${code}`);
  });

  res.send({ message: 'Streaming started' });
});

// Stop streaming
server.post('/stop-stream', (req, res) => {
  if (streamProcess) {
    streamProcess.kill(); // Stop the streaming process
    streamProcess = null;
    res.send({ message: 'Streaming stopped' });
  } else {
    res.status(400).send({ error: 'No active stream to stop' });
  }
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
