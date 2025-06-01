# Use official Node.js LTS image
FROM node:18

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose port (update if your service uses a different port)
EXPOSE 5001

# Start the app
CMD ["npm", "start"]
