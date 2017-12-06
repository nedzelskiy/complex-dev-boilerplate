#!/bin/bash
eval `grep "^export " ./sh/env.sh` && \
sh ./sh/erase-build-files.sh && \
node ./scripts/concurrently-wrapper.js \
"sh ./sh/server-app-restarter.sh" \
"sh ./sh/watcher-and-runner.sh" \
"sh ./sh/server-browser-restarter.sh" \
"sh ./sh/server-livereload-proxy.sh" \
"sh ./sh/ts-server-watch.sh"