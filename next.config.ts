const withPWA = require("next-pwa")({
  dest: "public",
    skipWaiting: true,
    register: true,
})

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,
});
