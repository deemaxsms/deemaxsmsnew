"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tellabotProxy = void 0;
const functions = require("firebase-functions");
const cors = require("cors");
const node_fetch_1 = require("node-fetch");
// Enable CORS for all origins
const corsHandler = cors({ origin: true });
// TellaBot API configuration
const TELLABOT_API_URL = 'https://www.tellabot.com/sims/api_command.php';
const TELLABOT_USER = 'wesz';
const TELLABOT_API_KEY = 'zV17cs7yofh6GXW9g6Ec9hC9cQwqhjZX';
exports.tellabotProxy = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
        try {
            // Only allow POST requests
            if (request.method !== 'POST') {
                response.status(405).json({ error: 'Method not allowed' });
                return;
            }
            const _a = request.body, { cmd } = _a, params = __rest(_a, ["cmd"]);
            if (!cmd) {
                response.status(400).json({ error: 'Missing cmd parameter' });
                return;
            }
            // Build query parameters for TellaBot API
            const queryParams = new URLSearchParams(Object.assign({ cmd, user: TELLABOT_USER, api_key: TELLABOT_API_KEY }, Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)]))));
            const fullUrl = `${TELLABOT_API_URL}?${queryParams}`;
            console.log(`TellaBot API Call: ${cmd}`, params);
            console.log(`URL: ${fullUrl}`);
            // Make request to TellaBot API
            const apiResponse = await (0, node_fetch_1.default)(fullUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000 // 10 second timeout
            });
            if (!apiResponse.ok) {
                throw new Error(`TellaBot API returned ${apiResponse.status}: ${apiResponse.statusText}`);
            }
            const responseText = await apiResponse.text();
            console.log(`TellaBot API Response: ${responseText.substring(0, 200)}`);
            // Try to parse as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            }
            catch (_b) {
                // If not JSON, return as text wrapped in success response
                data = {
                    success: true,
                    data: responseText
                };
            }
            // Return the response
            response.json(data);
        }
        catch (error) {
            console.error('TellaBot API Error:', error);
            response.status(500).json({
                error: error.message || 'Internal server error',
                success: false
            });
        }
    });
});
//# sourceMappingURL=index.js.map