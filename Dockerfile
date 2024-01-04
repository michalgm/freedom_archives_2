FROM node:lts-bookworm

EXPOSE 3030
WORKDIR /opt/freedomarchives
RUN mkdir thumbnails

COPY package* ./

RUN npm install

WORKDIR /opt/freedomarchives/frontend
COPY frontend/package* ./
RUN npm install

COPY frontend/ ./
RUN npm run build && cp -a ./dist ../public
WORKDIR /opt/freedomarchives
RUN rm -rf ./public/thumbnails && ln -s /opt/freedomarchives/thumbnails ./public/
COPY backend ./backend
COPY config ./config
ENV NODE_ENV=stage
ENV SECRET=secret
ENV PORT=3030
ENV HOST=0.0.0.0
ENV PGUSER=pg
ENV PGPASSWORD=pg
CMD ["node", "./backend/index.js"]
