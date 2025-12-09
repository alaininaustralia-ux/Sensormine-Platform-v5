#!/bin/bash
# Install PostGIS extension for TimescaleDB container

echo "Installing PostGIS..."
apk add --no-cache postgis postgis-dev

echo "PostGIS installation complete"
