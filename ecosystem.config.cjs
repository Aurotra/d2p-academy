module.exports = {
  apps: [
    {
      name: "d2p-academy",
      script: "server.js",
      cwd: "./.next/standalone",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NEXT_PUBLIC_SITE_URL: "https://www.d2p.com.tr",
        NEXT_PUBLIC_SUPABASE_URL: "https://vurzmpbwlgahzbilqsfa.supabase.co",
        // NEXT_PUBLIC_SUPABASE_ANON_KEY: "buraya-anon-key"
      },
    },
  ],
};
