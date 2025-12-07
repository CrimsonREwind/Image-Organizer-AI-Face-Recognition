# Use pre-built image with dlib and face_recognition already installed
FROM animcogn/face_recognition:latest

WORKDIR /app

# Copy requirements and install additional dependencies (face_recognition already installed)
COPY requirements.txt .

# Install remaining Python dependencies (skip face-recognition as it's pre-installed)
RUN pip install --no-cache-dir \
    Flask==3.0.0 \
    Flask-CORS==4.0.0 \
    Flask-PyMongo==2.3.0 \
    python-dotenv==1.0.0 \
    pymongo==4.6.1 \
    dnspython==2.4.2 \
    Pillow==10.1.0 \
    cloudinary==1.37.0 \
    Werkzeug==3.0.1 \
    gunicorn==21.2.0 \
    python-dateutil==2.8.2 \
    requests==2.32.5

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Run with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "run:app"]
