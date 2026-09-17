// Dev-only stub for ConfigService's bootstrap fetch. Run with `node mock-api.js`
// alongside `ng serve` so the app initializer (environment.configUrl) resolves.
const http = require('node:http');

http
  .createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({}));
  })
  .listen(3000, () => console.log('mock api on http://localhost:3000'));
