/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  rewrites: () => {
    return [
      {
        source: "/api/notion-proxy",
        destination: "https://api.notion.com/v1",
      },
    ];
  }
  
}


module.exports = nextConfig
