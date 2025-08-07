# GCP Deployment Guide - Preventing 5-Minute Timeouts

## 🚨 **Critical Issue: 5-Minute Disconnections**

The 5-minute disconnection issue in production is caused by **GCP Load Balancer timeouts**. Here's how to fix it:

## 🔧 **Solution 1: GCP Load Balancer Configuration**

### Update your `app.yaml` (if using App Engine):

```yaml
runtime: nodejs18
env: standard

automatic_scaling:
  min_idle_instances: 1
  max_idle_instances: 10
  min_pending_latency: 30ms
  max_pending_latency: 10s

network:
  session_affinity: true
  forwarded_ports:
    - 8080

env_variables:
  NODE_ENV: production
  PORT: 8080

# Critical: Configure timeouts
handlers:
  - url: /.*
    script: auto
    secure: always
    http_headers:
      X-Frame-Options: DENY
    # WebSocket timeout settings
    timeout: 3600s
```

### For Cloud Run, update your deployment:

```bash
gcloud run deploy your-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --timeout 3600 \
  --concurrency 80 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production
```

## 🔧 **Solution 2: Load Balancer Backend Configuration**

If using a custom load balancer, configure the backend:

```bash
# Update backend service
gcloud compute backend-services update your-backend-service \
  --timeout=3600 \
  --connection-draining-timeout=300
```

## 🔧 **Solution 3: Environment Variables**

Set these environment variables in your GCP deployment:

```bash
# In your deployment script or environment
export NODE_ENV=production
export KEEP_ALIVE_INTERVAL=240000  # 4 minutes
export WEBSOCKET_PING_INTERVAL=30000  # 30 seconds
export SERVER_TIMEOUT=65000  # 65 seconds
```

## 🔧 **Solution 4: Health Check Configuration**

### For App Engine, add to `app.yaml`:

```yaml
readiness_check:
  app_start_timeout_sec: 300
  check_interval_sec: 5
  timeout_sec: 4
  failure_threshold: 2
  success_threshold: 2

liveness_check:
  initial_delay_sec: 30
  check_interval_sec: 30
  timeout_sec: 4
  failure_threshold: 4
  success_threshold: 2
```

## 🔧 **Solution 5: WebSocket Proxy Configuration**

If using a reverse proxy (nginx), add this configuration:

```nginx
# nginx.conf
upstream websocket {
    server your-app:8080;
}

server {
    listen 80;
    server_name your-domain.com;

    location /media-stream {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Critical timeout settings
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_connect_timeout 60s;
        
        # WebSocket specific
        proxy_buffering off;
        proxy_cache off;
    }
}
```

## 🔧 **Solution 6: Monitoring & Debugging**

### Add these logs to monitor the issue:

```javascript
// In your WebSocket close handler
openAiWs.on('close', (code, reason) => {
    const sessionDuration = Math.round((Date.now() - lastActivityTime) / 1000);
    console.log(`WebSocket closed after ${sessionDuration} seconds`);
    console.log(`Close code: ${code}, Reason: ${reason}`);
    
    // Log to Cloud Logging for analysis
    console.log(JSON.stringify({
        severity: 'WARNING',
        message: 'WebSocket disconnected',
        sessionDuration,
        closeCode: code,
        reason,
        timestamp: new Date().toISOString()
    }));
});
```

## 🔧 **Solution 7: Automatic Reconnection**

### Implement automatic reconnection logic:

```javascript
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

const reconnectWebSocket = () => {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`Attempting reconnection ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        
        setTimeout(() => {
            // Reinitialize WebSocket connection
            initializeWebSocket();
        }, 2000 * reconnectAttempts); // Exponential backoff
    }
};
```

## 🚀 **Deployment Checklist**

- [ ] Set `NODE_ENV=production`
- [ ] Configure GCP Load Balancer timeouts to 3600s
- [ ] Update keep-alive interval to 4 minutes
- [ ] Add WebSocket ping/pong (30s interval)
- [ ] Configure server timeouts (65s keepAlive, 66s headers)
- [ ] Set up health checks
- [ ] Configure reverse proxy timeouts (if applicable)
- [ ] Add comprehensive logging
- [ ] Test with long-running calls (>10 minutes)

## 🔍 **Troubleshooting Commands**

```bash
# Check GCP logs
gcloud logging read "resource.type=gce_instance AND textPayload:WebSocket" --limit=50

# Monitor WebSocket connections
gcloud compute instances get-serial-port-output your-instance-name

# Check load balancer health
gcloud compute backend-services get-health your-backend-service
```

## 📊 **Expected Results**

After implementing these fixes:
- ✅ Calls should last beyond 5 minutes
- ✅ WebSocket connections remain stable
- ✅ Keep-alive messages sent every 4 minutes
- ✅ Automatic reconnection on failures
- ✅ Detailed logging for debugging

## 🆘 **If Issues Persist**

1. Check GCP Cloud Logging for timeout errors
2. Verify load balancer configuration
3. Test with different regions
4. Consider using Cloud Run instead of App Engine
5. Implement circuit breaker pattern 