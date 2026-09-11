#!/bin/sh
set -eu
umask 077
# Source is transported only on stdin, never as a shell argument or expression.
cat > /work/main.cpp
exec /usr/local/bin/g++ -std=c++20 -O0 -pthread -Wall -Wextra -pedantic \
  -fdiagnostics-color=never -fmax-errors=10 /work/main.cpp -o /work/program
