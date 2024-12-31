#!/bin/sh
export JSON_STRING='window.configs = { \
  "VITE_API_BASE_URL":"'${VITE_API_BASE_URL}'", \
}'
sed "s|\/\/ CONFIGURATIONS_PLACEHOLDER|${JSON_STRING}|" /usr/share/nginx/html/preview-prototype/index.html.tmpl > /tmp/index.html

exec "$@" 