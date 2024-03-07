const express = require('express');
const path = require('path');
const mysql = require('mysql');
var bodyParser = require('body-parser');

const app = express();
const port = 3000;


// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (e.g., CSS, images)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets',express.static("assets"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define a simple route
app.get('/', (req, res) => {
    res.render('login', { name: 'Freelance Pro' });
});
app.get('/register', (req, res) => {
    res.render('register', { name: 'Freelance Pro' });
});
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { name: 'Freelance Pro' });
});
app.post('/register', (req, res) => {
    res.render('register', { name: 'Freelance Pro' });
    console.log(req.body)
});
app.post('/index', (req, res) => {
    res.render('index', { name: 'Freelance Pro' });
});
app.post('/events', (req, res) => {
    res.render('events', { name: 'Freelance Pro' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});



// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost',        // replace with your database host
  user: 'root',    // replace with your database username
  password: '',// replace with your database password
  database: 'freelancepro' // replace with your database name
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
  
  // Perform your database operations here
  
  // Close the connection when done
  connection.end((err) => {
    if (err) {
      console.error('Error closing the database connection:', err);
      return;
    }
    console.log('Connection closed');
  });
});
