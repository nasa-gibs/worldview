# keep this updated to match the current version of playwright
FROM mcr.microsoft.com/playwright:v1.39.0-jammy

WORKDIR /app

COPY package*.json ./

COPY tasks ./tasks

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000