FROM node:18.19.1-alpine3.19 as builder

WORKDIR /app

RUN apk add --no-cache git

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm NPM_CONFIG_CACHE=/root/.npm npm install

COPY . ./

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.25-alpine

COPY --chown=nginx:nginx nginx.conf /etc/nginx/nginx.conf
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html/preview-prototype/
COPY docker/docker-entrypoint.sh /
RUN mv /usr/share/nginx/html/preview-prototype/index.html /usr/share/nginx/html/preview-prototype/index.html.tmpl \
    && cd /usr/share/nginx/html/preview-prototype/ \
    && ln -s /tmp/index.html

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"] 