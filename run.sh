#!/bin/bash

# Run deploy-commands.js
echo "Deploying commands..."
node deploy-commands.js

# Run bot.js and check for "Ready!" output
echo "Starting bot..."
node bot.js 
