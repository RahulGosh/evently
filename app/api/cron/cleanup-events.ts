import { NextApiRequest, NextApiResponse } from 'next';
import { deleteExpiredEvents } from '@/lib/actions/event.action';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await deleteExpiredEvents();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in cleanup endpoint:', error);
    return res.status(500).json({ error: 'Failed to run cleanup' });
  }
}