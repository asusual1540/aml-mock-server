import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { NextRequest } from 'next/server';

const LOG_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

interface LogData {
    timestamp: string;
    method: string;
    url: string;
    headers: Record<string, string | string[] | undefined>;
    ip: string;
    location: string;
    body?: any;
}

async function getLocationFromIP(ip: string): Promise<string> {
    try {
        // Clean IP address (remove IPv6 prefix if present)
        const cleanIp = ip.replace(/^::ffff:/, '');

        // Skip localhost
        if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost') {
            return 'Localhost';
        }

        const response = await axios.get(`http://ip-api.com/json/${cleanIp}`, {
            timeout: 3000,
        });

        if (response.data && response.data.status === 'success') {
            return `${response.data.city}, ${response.data.regionName}, ${response.data.country}`;
        }
    } catch (error) {
        // Silently fail, return Unknown
    }
    return 'Unknown';
}

function getClientIP(request: NextRequest): string {
    // Try various headers for IP address
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const real = request.headers.get('x-real-ip');
    if (real) {
        return real;
    }

    return 'Unknown';
}

export async function logRequest(request: NextRequest, body?: any) {
    const ip = getClientIP(request);
    const location = await getLocationFromIP(ip);

    const logData: LogData = {
        timestamp: new Date().toISOString(),
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        ip,
        location,
    };

    if (body) {
        logData.body = body;
    }

    // Console log
    console.log('======================== Incoming Request =============================');
    console.log('Time:', logData.timestamp);
    console.log('Method:', logData.method);
    console.log('URL:', logData.url);
    console.log('IP:', logData.ip);
    console.log('Location:', logData.location);
    if (body) {
        console.log('Body:', body);
    }
    console.log('=======================================================================');

    // Write to disk
    const logFileName = `requests-${new Date().toISOString().split('T')[0]}.log`;
    const logFilePath = path.join(LOG_DIR, logFileName);

    const logEntry = JSON.stringify(logData) + '\n';

    try {
        fs.appendFileSync(logFilePath, logEntry);
    } catch (error) {
        console.error('Failed to write log to disk:', error);
    }
}
