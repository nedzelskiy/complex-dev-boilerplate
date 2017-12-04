#!/bin/bash
export CONFIGS_SERVICES__DIR="configs"                                                                            &&

export SERVER__PORT=6655                                                                                          &&
export SERVER__BUILD_FOLDER="build"                                                                               &&
export SERVER__SRC_FOLDER="src/server/src"                                                                        &&
export SERVER__SRC_TEST_FOLDER="src/server/tests"                                                                 &&
export SERVER__URL="http://localhost:${SERVER__PORT}"                                                             &&

export CLIENT__SRC_FOLDER="src/client"                                                                            &&
export CLIENT__BUILD_FOLDER="${SERVER__BUILD_FOLDER}/client"                                                      &&

export SERVER_LIVERELOAD_PROXY__PORT=6006                                                                         &&
export SERVER_LIVERELOAD_PROXY__URL="http://localhost:${SERVER_LIVERELOAD_PROXY__PORT}"                           &&

export SERVER_APP_RESTARTER__PORT=6601                                                                            &&
export SERVER_APP_RESTARTER__LAUNCH_FILE="${SERVER__BUILD_FOLDER}/server.js"                                      &&
export SERVER_APP_RESTARTER__URL="http://localhost:${SERVER_APP_RESTARTER__PORT}"                                 &&

export SERVER_BROWSER_RESTARTER__PORT=6602                                                                        &&
export SERVER_BROWSER_RESTARTER__URL="http://localhost:${SERVER_BROWSER_RESTARTER__PORT}"                         &&

export CONCURRENTLY_WRAPPER__PORT=6600                                                                            &&

export WATCHER_AND_RUNNER__PORT=6603                                                                              &&
export WATCHER_AND_RUNNER__WAY_TO_CONFIG='scripts/watcher-and-runner.conf.js'                                     &&

export LOG_FOLDER='log'


