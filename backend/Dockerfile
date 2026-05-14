# Use the official Python image.
FROM python:3.11-slim

# Allow statements and errors to be immediately logged to the Cloud Run logs
ENV PYTHONUNBUFFERED True

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./

# Install production dependencies.
RUN pip install --no-cache-dir -r requirements.txt

# Run the web service on container startup.
# Using port 8080 as per Cloud Run default, gunicorn handles the PORT env var automatically.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app
