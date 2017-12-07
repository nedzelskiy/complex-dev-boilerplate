#!/bin/bash
eval `grep "^export " ./sh/env.sh` && \
node ./scripts/make-server-configs.js && \
node node_modules/tsc-watch/index.js -p ${CONFIGS_SERVICES__DIR}/tsconfig-server.json --onSuccess "node ./scripts/build-server-script.js"