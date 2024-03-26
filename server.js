const express = require("express");
const path = require("path");
const session = require("express-session");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const app = express();
const port = 3000;

// Set up EJS as the view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Serve static files (CSS, JavaScript, etc.)
app.use(express.static(path.join(__dirname, "public")));

app.use("/assets", express.static("assets"));
app.use(express.static("views"));

// Parse URL-encoded bodies (e.g., form data)
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies
app.use(bodyParser.json());

// Set up sessions
app.use(
  session({
    secret: "your_secret_key", // Change this to a more secure key
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 60 * 1000 }, // 30 minutes
  })
);

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.redirect("/login");
  }
};

const createDbPool = (databaseName) =>
  mysql
    .createPool({
      host: "localhost",
      user: "root",
      password: "",
      database: databaseName,
    })
    .promise();

const dbFreelance = createDbPool("freelancepro");

// Routes
app.get("/", isAuthenticated, (req, res) => {
  // console.log(req.session);
  res.render("home", {
    username: req.session.user.name,
    email: req.session.user.username,
  });
});

app.get("/login", (req, res) => {
  res.render("login", { name: "Freelance Pro" });
});

app.get("/register", (req, res) => {
  res.render("register", { name: "Freelance Pro" });
});

app.get("/index", (req, res) => {
  res.render("index", { name: "Freelance Pro" });
});

app.get("/events", (req, res) => {
  res.render("events", { name: "Freelance Pro" });
});

app.get("/contacts", (req, res) => {
  res.render("contacts", { name: "Freelance Pro" });
});

app.get("/clients", async (req, res) => {
  try {
    const [rows] = await dbFreelance.execute("SELECT * FROM `clients`");

    const company = rows[0].company_name;
    const fname = rows[0].first_name;
    const lname = rows[0].last_name;
    const username = rows[0].username;
    const email = rows[0].email;
    const phone = rows[0].phone;

    res.render("clients", {
      name: "Freelance Pro",
      clients: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/clients-list", (req, res) => {
  res.render("clients-list", { name: "Freelance Pro" });
});

app.get("/client-profile", async (req, res) => {
  const client_id = req.query.client_id;

  try {
    const [rows] = await dbFreelance.execute(
      "SELECT * FROM `projects` WHERE `client_id` = ?",
      [client_id]
    );

    const [rows2] = await dbFreelance.execute(
      "SELECT * FROM `clients` WHERE `client_id` = ?",
      [client_id]
    );

    const company = rows2[0].company_name;
    const fname = rows2[0].first_name;
    const lname = rows2[0].last_name;
    const username = rows2[0].username;
    const email = rows2[0].email;
    const phone = rows2[0].phone;

    let projects = [];
    let tasks = [];

    if (rows.length > 0) {
      const [rows3] = await dbFreelance.execute(
        "SELECT * FROM `tasks` WHERE `project_id` = ?",
        [rows[0].project_id]
      );
      projects = rows;
      tasks = rows3;
    }

    res.render("client-profile", {
      name: "Freelance Pro",
      projects: projects,
      tasks: tasks,
      company: company,
      fname: fname,
      lname: lname,
      username: username,
      email: email,
      phone: phone,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/projects", async (req, res) => {
  try {
    const [rows] = await dbFreelance.execute("SELECT * FROM `projects`");

    res.render("projects", {
      name: "Freelance Pro",
      projects: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/project-view", async (req, res) => {
  const project_id = req.query.id;

  try {
    const [rows] = await dbFreelance.execute(
      "SELECT * FROM `projects` WHERE `project_id` = ?",
      [project_id]
    );

    const [rows2] = await dbFreelance.execute(
      "SELECT COUNT(*) AS total_tasks, SUM(CASE WHEN task_status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks FROM `tasks` WHERE `project_id` = ?",
      [project_id]
    );

    const [rows3] = await dbFreelance.execute(
      "SELECT * FROM `tasks` WHERE `project_id` = ?",
      [project_id]
    );

    const project_name = rows[0].project_name;
    const project_status = rows[0].project_status;
    const start_date = rows[0].start_date;
    const end_date = rows[0].end_date;
    const rate = rows[0].rate;
    const rate_details = rows[0].rate_details;
    const priority = rows[0].priority;
    const description = rows[0].description;

    // Calculate percentage completion
    const totalTasks = rows2[0].total_tasks;
    const completedTasks = rows2[0].completed_tasks;
    const percentageCompletion =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    res.render("project-view", {
      name: "Freelance Pro",
      projects: rows,
      tasks: rows3,
      project_name: project_name,
      project_status: project_status,
      start_date: start_date,
      end_date: end_date,
      rate: rate,
      rate_details: rate_details,
      priority: priority,
      description: description,
      percentageCompletion: percentageCompletion, // Pass percentage completion to the template
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/tasks", async (req, res) => {
  try {
    const [rows] = await dbFreelance.execute("SELECT * FROM `tasks`");

    res.render("tasks", {
      name: "Freelance Pro",
      tasks: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/invoices", (req, res) => {
  res.render("invoices", { name: "Freelance Pro" });
});

app.get("/create-invoice", async (req, res) => {
  try {
    const [rows] = await dbFreelance.execute("SELECT * FROM `clients`");
    const [rows2] = await dbFreelance.execute("SELECT * FROM `projects`");

    res.render("create-invoice", {
      name: "Freelance Pro",
      clients: rows,
      projects: rows2,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/payments", (req, res) => {
  res.render("payments", { name: "Freelance Pro" });
});

app.get("/expenses", (req, res) => {
  res.render("expenses", { name: "Freelance Pro" });
});

app.get("/task-board", async (req, res) => {
  try {
    const [rows] = await dbFreelance.execute("SELECT * FROM `tasks`");

    res.render("task-board", {
      name: "Freelance Pro",
      tasks: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/invoice-view", async (req, res) => {
  const {
    itemDetails,
    grandTotal,
    client,
    clientName,
    project,
    tax,
    email,
    client_address,
    billing_address,
    invoice_date,
    due_date,
  } = req.query;

  let data = itemDetails; // Assign itemDetails directly to data

  // Check if data is an array, if not, convert it to an array
  if (!Array.isArray(data)) {
    data = [data]; // Convert to an array with a single element
  }

  console.log(data);
  console.log(data[0]);

  try {
    const [rows] = await dbFreelance.execute("SELECT * FROM `invoices`");

    // Assuming you have fetched the invoice ID from the database and stored it in a variable called invoiceIdFromDb

    // Get today's date
    const today = new Date();
    const month = today.getMonth() + 1; // Adding 1 because getMonth() returns zero-based index
    const year = today.getFullYear();

    // Format month and year as two-digit strings
    const formattedMonth = month < 10 ? "0" + month : month.toString();
    const formattedYear = year.toString().slice(-2); // Get last two digits of the year

    // Concatenate invoice ID from the database with today's month and year
    const invoice_id = `inv${rows[0].invoice_id}-${formattedMonth}${formattedYear}`;

    res.render("invoice-view", {
      name: "Freelance Pro",
      invoice_id: invoice_id,
      grandTotal: grandTotal,
      data: data, // Pass data as an object property
      client: client,
      clientName: clientName,
      project: project,
      tax: tax,
      email: email,
      client_address: client_address,
      billing_address: billing_address,
      invoice_date: invoice_date,
      due_date: due_date,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});



app.post("/index", (req, res) => {
  res.render("index", { name: "Freelance Pro" });
});

app.post("/events", (req, res) => {
  res.render("events", { name: "Freelance Pro" });
});

// New Client
app.post("/create/client", (req, res) => {
  console.log(req.body);
  const {
    fname,
    lname,
    username,
    email,
    password,
    confirm,
    clientID,
    phone,
    company,
  } = req.body;

  try {
    const sql =
      "INSERT INTO clients (company_name, first_name, last_name, username, email, phone, password) VALUES (?, ?, ?, ?, ?, ?, ?)";
    dbFreelance.execute(sql, [
      company,
      fname,
      lname,
      username,
      email,
      phone,
      password,
    ]);

    res.status(200).json({
      status: `Client details submitted successfully!`,
    });
  } catch (error) {
    if (error) {
      console.error(error);
    }
  }
});

// New Project
app.post("/create/project", (req, res) => {
  console.log(req.body);
  const {
    name,
    client,
    start_date,
    end_date,
    rate,
    frequency,
    priority,
    description,
  } = req.body;

  try {
    const sql =
      "INSERT INTO projects (project_name, client_id, start_date, end_date, rate, rate_details, priority, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    dbFreelance.execute(sql, [
      name,
      "1",
      start_date,
      end_date,
      rate,
      frequency,
      priority,
      description,
    ]);

    res.status(200).json({
      status: `Project details submitted successfully!`,
    });
  } catch (error) {
    if (error) {
      console.error(error);
    }
  }
});

// New Task
app.post("/create/task", (req, res) => {
  console.log(req.body);
  const { name, priority, due_date } = req.body;

  try {
    const sql =
      "INSERT INTO tasks (task_name, project_id, task_priority, task_deadline) VALUES (?, ?, ?, ?)";
    dbFreelance.execute(sql, [name, "3", priority, due_date]);

    res.status(200).json({
      status: `Project details submitted successfully!`,
    });
  } catch (error) {
    if (error) {
      console.error(error);
    }
  }
});

// New User
app.post("/create/account", async (req, res) => {
  console.log(req.body);
  const { username, email, password, confirm } = req.body;

  // Check if password and confirm password match
  if (password !== confirm) {
    return res.status(400).json({ status: "Passwords do not match" });
  }

  try {
    // Check if email already exists in the database
    const [existingUsers] = await dbFreelance.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    // If email already exists, return an error
    if (existingUsers.length > 0) {
      return res.status(400).json({ status: "Email already exists" });
    }

    // If email is unique, proceed with user insertion
    const sql =
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    await dbFreelance.execute(sql, [username, email, password]);

    res.status(200).json({
      status: "User details submitted successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "Internal Server Error" });
  }
});

// Login User
app.post("/login/user", async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;

  try {
    // Check if user exists in the database
    const [existingUsers] = await dbFreelance.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    // If no user found with the given username, return an error
    if (existingUsers.length === 0) {
      return res.status(404).json({ status: "User not found" });
    }

    // Verify if the provided password matches the stored password
    const user = existingUsers[0];
    if (password !== user.password) {
      console.error("Incorrect password")
      return res.status(401).json({ status: "Incorrect password" });
    }

    res.redirect("/index");

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "Internal Server Error" });
  }
});



// New Invoice
app.post("/create/invoice", async (req, res) => {
  console.log(req.body);
  const {
    itemDetails,
    client,
    project,
    tax,
    email,
    client_address,
    billing_address,
    invoice_date,
    due_date,
  } = req.body;

  try {
    // Serialize itemDetails into JSON string
    const serializedItemDetails = JSON.stringify(itemDetails);

    const sql =
      "INSERT INTO invoices (client_id, project_id, email, tax, client_address, billing_address, invoice_date, due_date, item) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    await dbFreelance.execute(sql, [
      client,
      project,
      email,
      tax,
      client_address,
      billing_address,
      invoice_date,
      due_date,
      serializedItemDetails, // Insert serialized itemDetails
    ]);

    res.status(200).json({
      status: `Project details submitted successfully!`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/signout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/login");
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
