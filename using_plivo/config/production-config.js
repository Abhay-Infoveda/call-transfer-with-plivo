// Production configuration for GCP deployment
export const PRODUCTION_CONFIG = {
    // WebSocket settings
    websocket: {
        pingInterval: 30000, // 30 seconds
        pingTimeout: 10000,  // 10 seconds
        maxPayload: 1024 * 1024, // 1MB
        perMessageDeflate: false // Disable compression for better performance
    },
    
    // Keep-alive settings
    keepAlive: {
        interval: 4 * 60 * 1000, // 4 minutes (more aggressive for production)
        timeout: 10000 // 10 seconds timeout
    },
    
    // Server settings
    server: {
        keepAliveTimeout: 65000, // 65 seconds
        headersTimeout: 66000,   // 66 seconds
        maxConnections: 1000
    },
    
    // OpenAI settings
    openai: {
        maxRetries: 3,
        retryDelay: 2000, // 2 seconds
        sessionTimeout: 30 * 60 * 1000 // 30 minutes
    },
    
    // Twilio settings
    twilio: {
        streamTimeout: 3600, // 1 hour
        keepCallAlive: true,
        bidirectional: true
    }
};

// Environment-specific settings
export const getConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
        return {
            ...PRODUCTION_CONFIG,
            // Additional production-specific settings
            logging: {
                level: 'info',
                enableDebug: false
            }
        };
    }
    
    return {
        ...PRODUCTION_CONFIG,
        // Development settings
        keepAlive: {
            ...PRODUCTION_CONFIG.keepAlive,
            interval: 10 * 60 * 1000 // 10 minutes for development
        },
        logging: {
            level: 'debug',
            enableDebug: true
        }
    };
}; 