module.exports = {
  apps: [
    {
      name: 'abc-logistics',
      script: 'http-server',
      args: '/home/polarbaejr/Demo/Accounting_Dashboard -p 3001 -a 127.0.0.1 --cors -c-1',
      interpreter: 'none',
      cwd: '/home/polarbaejr/Demo/Accounting_Dashboard',
      watch: false,
      autorestart: true,
      env: {
        PORT: 3001,
      },
    },
  ],
};
