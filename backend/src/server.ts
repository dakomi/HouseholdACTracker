import http from 'http';
import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initSocketService } from './services/socketService';

const PORT = parseInt(process.env.PORT || '3001', 10);

const server = http.createServer(app);
initSocketService(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;
