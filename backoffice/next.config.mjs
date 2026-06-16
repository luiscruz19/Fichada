/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // El panel vive bajo /backoffice (Traefik: Host(fichada.sda.ovh) && PathPrefix(/backoffice)).
    // basePath hace que páginas, assets y route handlers (/api/*) cuelguen de /backoffice.
    basePath: '/backoffice',
};

export default nextConfig;
