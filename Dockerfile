# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Install FFmpeg as a system dependency
RUN apt-get update && apt-get install -y ffmpeg

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file from the backend folder and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend folder into the container
COPY backend/ ./backend

# Expose port 8080 for the Flask app
EXPOSE 8080

# Run the Flask app using Gunicorn
# The module path is set to "backend.app" because your app.py is in the backend folder and exposes "app"
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "backend.app:app"]
