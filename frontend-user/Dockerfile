# Use a multi-platform base image
FROM nginx:alpine

# Copy static files to nginx html directory
COPY . /usr/share/nginx/html

# Expose port 80 (will be mapped to 8081 by docker-compose)
EXPOSE 80

# Default command to run nginx
CMD ["nginx", "-g", "daemon off;"]
