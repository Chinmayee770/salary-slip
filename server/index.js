const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const bodyParser = require("body-parser");

const app = express();
const port = 5003;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Replace with your MySQL username
  password: "Chinmayee@770", // Replace with your MySQL password
  database: "salary_db", // Replace with your database name
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database!");
});

// Add Employee Salary Details
app.post("/addEmployee", (req, res) => {
  const { name, department, basic, hra, da, tax } = req.body;

  // Calculate total salary
  const salary = parseFloat(basic) + parseFloat(hra) + parseFloat(da) - parseFloat(tax);

  const query = `INSERT INTO employees (name, department, basic, hra, da, tax, salary) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(query, [name, department, basic, hra, da, tax, salary], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(201).send({ message: "Employee added successfully!" });
  });
});

// Get All Employee Salary Details
app.get("/employees", (req, res) => {
  const query = "SELECT * FROM employees";
  db.query(query, (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(result);
  });
});

// Delete Employee
// Delete Employee
app.delete("/deleteEmployee/:id", (req, res) => {
    const { id } = req.params; // Extract ID from the URL parameter
  
    if (!id) {
      return res.status(400).send({ message: "Employee ID is required." });
    }
  
    // Validate that ID is a valid number
    if (isNaN(id)) {
      return res.status(400).send({ message: "Invalid Employee ID." });
    }
  
    const query = "DELETE FROM employees WHERE id = ?";
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error("Error deleting employee:", err);
        return res.status(500).send({ message: "Error deleting employee.", error: err });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "Employee not found." });
      }
  
      res.status(200).send({ message: "Employee deleted successfully!" });
    });
  });
  

// Generate Salary Slip as PDF
app.get("/generateSlip/:id", (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM employees WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).send(err);

    if (result.length === 0) {
      return res.status(404).send({ message: "Employee not found!" });
    }

    const employee = result[0];
    const doc = new PDFDocument();

    // Set response headers for PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Salary_Slip_${id}.pdf`);

    // Generate Enhanced PDF
    doc.pipe(res);

    // Company logo and title
    doc.image("company_logo.png", 50, 50, { width: 100 })
      .fontSize(18)
      .text("Company Name", 200, 50, { align: "center" })
      .fontSize(16)
      .text("Salary Slip", { align: "center" })
      .moveDown();

    // Employee Details Section
    doc.fontSize(12).text(`Employee Name: ${employee.name}`, { continued: true })
      .text(`Department: ${employee.department}`, { align: "right" })
      .moveDown();
    doc.text(`Basic Salary: ${employee.basic}`);
    doc.text(`HRA: ${employee.hra}`);
    doc.text(`DA: ${employee.da}`);
    doc.text(`Tax Deducted: ${employee.tax}`);
    doc.text(`Total Salary: ${employee.salary}`, { align: "right", underline: true });

    doc.moveDown();
    doc.text("Thank you for your service.", { align: "center" });

    doc.end();
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
