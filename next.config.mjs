/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  /* Slash final conservé, comme sur l'ancien site WooCommerce. Les URL des
     campagnes publicitaires (/product-category/<slug>/) sont ainsi servies
     directement, sans redirection. */
  trailingSlash: true,
};

export default nextConfig;
