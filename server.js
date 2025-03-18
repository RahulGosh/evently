// server.js

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initEventCleanupJob } = require('./lib/cron/eventCleanup');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

    // "start": "next start",

app.prepare().then(() => {
  // Initialize the cron job when the server starts
  const cleanupJob = initEventCleanupJob();
  
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(process.env.PORT || 3000, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${process.env.PORT || 3000}`);
  });
  
  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('Stopping cron jobs');
    cleanupJob.stop();
    process.exit(0);
  };
  
  // Listen for termination signals
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
});