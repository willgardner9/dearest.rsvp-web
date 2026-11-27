# The CI job builds the site and puts the files in dist/.
# This image only serves those files. It does not build the site.
# This base image runs nginx as a user that is not root. It listens on port 8080.
FROM nginxinc/nginx-unprivileged:1-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html
EXPOSE 8080
