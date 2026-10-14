module.exports = {
  apps: [
    {
      name: "exam-system",
      script: "node_modules/ts-node/dist/bin.js",
      args: "src/server.ts",
      instances: 4,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 3000
      }
    }
  ]
};
