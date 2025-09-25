# Use an official Node.js runtime as a parent image
# Using Alpine for a smaller image size
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
# Use wildcard to copy both if lock file exists
COPY package*.json ./

# Install backend dependencies
# Use --omit=dev if you don't need devDependencies like nodemon in the final image
# RUN npm install --omit=dev
RUN npm install

# Copy the rest of the backend source code
COPY . .

# Backend API port
EXPOSE 3001

# Command to run the backend application using the start script from package.json
CMD [ "npm", "start" ]

# Optional: Use nodemon for development for auto-restarts (ensure nodemon is installed)
# CMD [ "npm", "run", "dev" ]
