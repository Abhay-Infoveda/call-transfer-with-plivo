# Use an official Node.js runtime as a parent image (Alpine is lightweight)
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json from the 'using_plivo' directory
COPY using_plivo/package*.json ./

# Install dependencies using npm ci for a clean, reproducible install
# --only=production will skip devDependencies
RUN npm ci --only=production

# Copy the rest of the application source code from 'using_plivo'
COPY using_plivo/ .

# The application listens on port 8000
EXPOSE 8000

# The command to run the application
CMD [ "node", "index.js" ] 