/**
 * Vercel Serverless Function to proxy Tellabot API requests
 * This bypasses CORS issues by making server-side requests
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract query parameters from the request
    const queryParams = new URLSearchParams();
    
    // Forward all query parameters to Tellabot
    Object.entries(req.query).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });

    // Build the Tellabot API URL
    const tellabotUrl = `https://www.tellabot.com/sims/api_command.php?${queryParams.toString()}`;
    
    console.log('Proxying request to:', tellabotUrl.replace(/api_key=[^&]+/, 'api_key=***'));

    // Make the request to Tellabot
    const response = await fetch(tellabotUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SMSGlobe-Proxy/1.0'
      }
    });

    // Check if the response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tellabot API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Tellabot API error: ${response.status}`,
        details: errorText 
      });
    }

    // Get the response data
    const data = await response.json();
    
    // Set CORS headers to allow your frontend to access this
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Return the data
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to proxy request to Tellabot',
      details: error.message 
    });
  }
}