FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install --save recharts tailwindcss@3.3.0 postcss autoprefixer

# Make sure the start command doesn't exit immediately
EXPOSE 3000
CMD ["npm", "start"]
