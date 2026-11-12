#!/bin/bash
# Double-click in Finder to run QUEST locally. Close this window (or press Ctrl+C) to stop.
cd "$(dirname "$0")" || exit 1
PORT="${PORT:-8766}"
( sleep 1.2; open "http://localhost:$PORT" ) &
exec /usr/bin/ruby scripts/serve.rb "$PORT"
