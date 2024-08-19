#!/bin/bash

# Navigate to the second package directory and run npm command
cd designeralphabet
#npm install
npm run dev -- --open &

# Navigate to the first package directory and run npm command
cd ../content
#npm install
npm run dev -- --open &

# Wait for all background processes to finish
wait