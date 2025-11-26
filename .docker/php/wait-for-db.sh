#!/usr/bin/env bash
# simple wait-for Postgres before proceeding
set -e
host="${1:-db}"
port="${2:-5432}"
until pg_isready -h "$host" -p "$port" >/dev/null 2>&1; do
  echo "Waiting for Postgres at $host:$port..."
  sleep 1
done
echo "Postgres is ready."
