#!/bin/bash
set -e

REPO=https://github.com/lovell/sharp-libvips
# RELEASE_TAG=$(curl -s "https://api.github.com/repos/lovell/sharp-libvips/releases/latest" | jq -r .tag_name)
RELEASE_TAG=v8.16.1
rm -rf sharp-libvips

git clone --depth 1 --branch $RELEASE_TAG "${REPO}"
cd sharp-libvips
git apply ../pdfium.patch

export VERSION_LATEST_REQUIRED=false
LIBVIPS_VERSION=$(cat LIBVIPS_VERSION)
./build.sh ${LIBVIPS_VERSION} linux-x64
tar -xzvf "./libvips-${LIBVIPS_VERSION}-linux-x64.tar.gz" -C ./npm/linux-x64
cd ../
npm pack ./sharp-libvips/npm/linux-x64
rm -rf sharp-libvips


