#!/bin/bash

echo "🔨 Construindo imagem Docker..."
docker build -t theseed2-server .

echo "🚀 Executando container..."
docker run -p 8080:8080 --env-file .env theseed2-server 