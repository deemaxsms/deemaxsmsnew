/**
 * Simple test endpoint to verify Vercel functions are working
 */

export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Vercel API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    query: req.query
  });
} 