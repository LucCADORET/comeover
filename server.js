const express = require('express');
const path = require('path');
const port = process.env.PORT || 8080;
const app = express();

// the __dirname is the current directory from where the script is running
app.use(express.static(path.join(__dirname, 'dist')));

function requireHTTPS(req, res, next) {
  // The 'x-forwarded-proto' check is for Heroku
  if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "development") {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
}

app.use(requireHTTPS);

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
