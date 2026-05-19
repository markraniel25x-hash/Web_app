/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/Web_app',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
