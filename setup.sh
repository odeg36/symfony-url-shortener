#!/bin/bash

echo "Setting up URL Shortener Project..."
echo ""

# Check if required commands are available
if ! command -v make &> /dev/null; then
    echo "Error: 'make' command not found."
    echo "Please install make: brew install make"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "Error: 'docker' command not found."
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "Error: 'docker compose' command not found."
    echo "Please make sure Docker Compose is installed and running."
    exit 1
fi

echo "Prerequisites check passed"
echo ""
echo "Starting setup with Docker..."
echo ""

# Run complete setup using make (which will start Docker and setup everything)
make setup

echo ""
echo "Application is ready!"
echo ""
echo "Open your browser and visit:"
echo "  Frontend: http://localhost:5176"
echo "  Backend API: http://localhost:8080"
echo "  API Docs: http://localhost:8080/api/doc"
echo ""
echo "To stop all services:"
echo "  make stop-all"
echo ""
