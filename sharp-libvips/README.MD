This directory exists to add pdf support to sharp by compiling a custom libvips.

The process looks like this:

1. `./build-sharp-libvips.sh`

   - fetches the sharp-libvips source from https://github.com/lovell/sharp-libvips
   - patches the lin.sh script to include pdfium support
   - runs the ./build.sh to create a tar.gz file containing the compiled libvips + dependencies
   - extracts that tar.gz into the linux-x64 npm package directory
   - runs `npm pack` to create a tar.gz file containing the patched sharp-libvips source
   - cleans up the checkout

2. to get around strange issues with the cpanel/cloud-linux's node setup, we install the package from a github url - this is the same dependency that is used by the sharp npm package for libvips
