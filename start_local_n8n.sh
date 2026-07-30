#!/usr/bin/env bash
# Automated Local n8n Startup Script
# To execute this script, run: ./start_local_n8n.sh (or bash start_local_n8n.sh)

echo "🚀 Starting local n8n instance with tunnel..."
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n docker.n8n.io/n8nio/n8n start --tunnel
