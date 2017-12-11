'use strict';

const SERVER__PORT: string = (process.env as any).SERVER__PORT || (process.env as any).PORT || 80;
const SERVER__URL: string = (process.env as any).SERVER__URL || `http://localhost:${SERVER__PORT}`;

import handleHttp from './handleHttp';
import { Server, createServer } from 'http';

const server: Server = createServer();

server.on('request', handleHttp).listen(SERVER__PORT, () => {
    console.log(`Server is running on ${SERVER__URL} ${new Date()}`);
});