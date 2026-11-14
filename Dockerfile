# The CI job builds the site and puts the files in dist/.
# This image only serves those files. It does not build the site.
FROM nginx:1-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html
EXPOSE 80
