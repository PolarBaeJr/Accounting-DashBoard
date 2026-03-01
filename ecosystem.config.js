module.exports = {
  apps: [
    {
      name: 'abc-logistics',
      script: 'http-server',
      args: '. -p 3001 -a 127.0.0.1 --cors -c-1',
      interpreter: 'none',
      watch: false,
      autorestart: true,
      env: {
        PORT: 3001,
      },
    },
  ],
};
