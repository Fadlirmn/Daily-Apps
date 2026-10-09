#!/bin/sh
nginx
cd /app/api
exec node server.js
