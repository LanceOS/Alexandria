#!/bin/sh
set -eu
# Check the effective sandbox, not just accepted Podman flags. This also runs
# before every compilation, before any learner-controlled process exists.
[ "$(id -u)" = 10001 ]
[ "$(ulimit -n)" = 64 ]
[ "$(ulimit -c)" = 0 ]
[ "$(cat /sys/fs/cgroup/memory.max)" = 268435456 ]
[ "$(cat /sys/fs/cgroup/memory.swap.max)" = 0 ]
[ "$(cat /sys/fs/cgroup/pids.max)" = 64 ]
[ "$(cat /sys/fs/cgroup/cpu.max)" = '100000 100000' ]
[ "$(ls /sys/class/net)" = lo ]
awk '
  /^CapEff:/ { caps = ($2 == "0000000000000000") }
  /^NoNewPrivs:/ { privileges = ($2 == "1") }
  /^Seccomp:/ { seccomp = ($2 == "2") }
  END { exit !(caps && privileges && seccomp) }
' /proc/self/status
awk '$2 == "/" && $4 ~ /(^|,)ro(,|$)/ { readonly = 1 } END { exit !readonly }' /proc/mounts
[ -w /work ] && [ -w /tmp ]
[ ! -e /run/podman/podman.sock ] && [ ! -e /var/run/docker.sock ]
/usr/local/bin/g++ -dumpversion > /dev/null
printf 'alexandria-sandbox-v1\n'
