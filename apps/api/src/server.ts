import express from 'express';
import {
  types,
  version,
  observer,
  createWorker,
  getSupportedRtpCapabilities,
  parseScalabilityMode
} from "mediasoup";


const app = express();
const PORT = 4000;

app.get('/', (req, res) => {
  res.send('Hello from Backend!');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
