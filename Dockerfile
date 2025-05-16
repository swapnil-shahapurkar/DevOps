# Example Dockerfile.
FROM node:18

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

RUN npm install -g serve
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
