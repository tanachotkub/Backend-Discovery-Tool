// /** @type {import('next').NextConfig} */
// const nextConfig = {}
// module.exports = nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
  // จำเป็นสำหรับ Docker multi-stage build
  output: 'standalone',
}

module.exports = nextConfig
