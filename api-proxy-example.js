// Example backend API route (Node.js/Express)
// This would go in your backend server

app.get('/api/tellabot', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query);
    const tellabotUrl = `https://www.tellabot.com/sims/api_command.php?${queryParams.toString()}`;
    
    const response = await fetch(tellabotUrl);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Tellabot proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy request to Tellabot' });
  }
});

// Or for Vercel serverless functions (api/tellabot.js):
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const queryParams = new URLSearchParams(req.query);
    const tellabotUrl = `https://www.tellabot.com/sims/api_command.php?${queryParams.toString()}`;
    
    const response = await fetch(tellabotUrl);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Tellabot proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy request to Tellabot' });
  }
}