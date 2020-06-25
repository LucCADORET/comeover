const express = require('express');
const path = require('path');
const port = process.env.PORT || 8080;
const app = express();
var sslRedirect = require('heroku-ssl-redirect');

// the __dirname is the current directory from where the script is running
app.use(express.static(path.join(__dirname, 'dist')));

// Don't redirect if the hostname is `localhost:port` or the route is `/insecure`
app.use(sslRedirect());

// send the user the ownership google file
app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/seo/robots.txt'));
});

// send the user the ownership google file
app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/seo/sitemap.xml'));
});

// send the user to index html page inspite of the url
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(port);
