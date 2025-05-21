#!/bin/bash

export PGOPTIONS=--search_path=freedom_archives
psql "$@"
