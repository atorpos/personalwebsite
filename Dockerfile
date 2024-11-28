# Step 1: Use the official Node.js image as the base image
FROM node:18-alpine AS builder

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json/yarn.lock to the container
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of the application files
COPY . .

# Step 6: Build the Next.js application
RUN npm run build

# Step 7: Use a smaller image for serving the app
FROM node:18-alpine

# Step 8: Set the working directory in the final image
WORKDIR /app

# Step 9: Copy built files from the previous stage
COPY --from=builder /app .

# Step 10: Expose port 3000
EXPOSE 3000

# Step 11: Start the application
CMD ["npm", "start"]