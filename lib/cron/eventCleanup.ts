import cron from 'node-cron';
import { deleteExpiredEvents } from '../actions/event.action';

// Initialize cron job to run every hour
export const initEventCleanupJob = () => {
  console.log('Initializing event cleanup cron job');
  
  // Schedule to run every hour
  const job = cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled event cleanup task:', new Date().toISOString());
    try {
      const result = await deleteExpiredEvents();
      console.log('Cleanup completed:', result);
    } catch (error) {
      console.error('Error in scheduled cleanup task:', error);
    }
  });

  return job;
};