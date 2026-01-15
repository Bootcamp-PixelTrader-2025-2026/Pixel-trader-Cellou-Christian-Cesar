const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Serveur Node.js avec Express');
});

app.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`);
});
