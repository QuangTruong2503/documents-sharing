const jwt = require('jsonwebtoken');

// Secret Key
const TokenSecretKey = process.env.TOKEN_SECRET_KEY;

// Function to decode a token
export function decodeToken(token) {
    try {
        const decoded = jwt.verify(token, TokenSecretKey);
        console.log("Decoded Token:", decoded);
        return decoded;
    } catch (error) {
        console.error("Error decoding token:", error.message);
        return null;
    }
}
