#!/bin/bash
# Update all ZeroBias packages to latest

echo "Updating ZeroBias packages..."

npm update @zerobias-com/zerobias-angular-client
npm update @zerobias-org/ngx-library
npm update @zerobias-org/types-core-js

echo "Package updates completed!"
