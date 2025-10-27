# Use Bun official image
FROM oven/bun:latest

WORKDIR /app

# Copy package files first for caching
COPY bun.lock package.json ./

RUN bun install

# Copy the rest of the project
COPY . .

# Run your bot
CMD ["bun", "start"]
