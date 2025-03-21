# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Expose port 8080 for Azure App Service
EXPOSE 8080

# Run the Flask app using Gunicorn on port 8080
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]
