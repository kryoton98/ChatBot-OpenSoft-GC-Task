
const rateLimitMap = new Map();
const rateLimiter = (req,res,next)=>{
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 60*1000;
    const limit = 10;
   if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, []);
    }

    const timestamps = rateLimitMap.get(ip);
    const validTimestamps = timestamps.filter(timestamp => now - timestamp < windowMs);

    if (validTimestamps.length >= limit) {
        return res.status(429).json({ 
            error: "Too many requests. Please wait a minute." 
        });
    }

    validTimestamps.push(now);
    rateLimitMap.set(ip, validTimestamps);

    next();
};
module.exports = rateLimiter;
