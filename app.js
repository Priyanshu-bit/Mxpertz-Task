const express = require("express");
const app = express();
const mongoose  = require('mongoose')

const database = require("./database/database.js");
const { connectMongoose } = database;
const fs = require('fs');
const fastcsv = require('fast-csv');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ejs = require("ejs");
const path = require("path");
const passport = require("passport");
const { initializingPassport, isauthenticated } = require("./passConfig.js");
const expressSession = require("express-session");
const User = require("./models/User.js");
const Interview = require("./models/Interview.js");
const Student = require("./models/student.js");
const cors = require('cors');
const Result =require("./models/allocation.js") ;








connectMongoose();

initializingPassport(passport);
app.use(cors());
app.use(express.static("./public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  expressSession({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get('/export-csv', async (req, res) => {
  try {
    // Query data from both models (collections)
    const students = await Student.find();
    const interviews = await Interview.find();
    const allocation = await Result.find();
    

    // Initialize an array to store the combined data
    const combinedData = [];

    // Iterate through both datasets and combine them
    students.forEach(student => {
      interviews.forEach(interview => {
        combinedData.push({
          studentId: student.student_id,
          studentName: student.name,
          studentCollege: student.college,
          studentStatus: student.status,
          interviewDate: interview.date,
          interviewCompany: interview.companyName,
          interviewStudentResult:allocation.status|| 'N/A'
        });
      });
    });

    // Define the CSV file path and name
    const csvFilePath = 'data.csv';

    const csvWriter = createCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'studentId', title: 'Student ID' },
        { id: 'studentName', title: 'Student Name' },
        { id: 'studentCollege', title: 'Student College' },
        { id: 'studentStatus', title: 'Student Status' },
        { id: 'interviewDate', title: 'Interview Date' },
        { id: 'interviewCompany', title: 'Interview Company' },
        { id: 'interviewStudentResult', title: 'Interview Student Result' }
      ]
    });

    // Write the data to the CSV file
    csvWriter.writeRecords(combinedData)
      .then(() => {
        // Send the CSV file as a response
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="data.csv"');
        res.download(csvFilePath, 'data.csv', (err) => {
          if (err) {
            console.error('Error sending CSV:', err);
            res.status(500).send('Internal Server Error');
          }
        });
      });

  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).send('Internal Server Error');
  }
});









app.get("/", (req, res) => {
  res.render("index");
});




app.post("/register", async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user) return res.status(400).send("User already exists");
  const newUser = await User.create(req.body);
  res.status(201).send({ user: newUser });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect:"/profile", // Redirect on successful login
    failureRedirect: "/register", // Redirect on failed login
  })
);

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/profile", isauthenticated, (req, res) => {
  const userName = req.user.name; // Assuming the user's name is stored in the 'username' field of the user object
  res.render("profile", { name: userName }); 
});





app.post('/submit', (req, res) => {
  // Extract student data from the request
  const {
      name,
      college,
      status,
      dsaScore,
      webDScore,
      reactScore,
      company,
      interviewDate,
      resultCompany,
      result
  } = req.body;

  // Create a new Student document
  const newStudent = new Student({
      name,
      college,
      status,
      dsaFinalScore: dsaScore,
      webDFinalScore: webDScore,
      reactFinalScore: reactScore,
      interviews: {
          company,
          date: interviewDate
      },
      results: {
          company: resultCompany,
          result
      }
  });

  // Save the new student to the database
  newStudent.save()
      .then(() => {
          res.redirect('/students'); // Redirect to the list of students
      })
      .catch(err => {
          console.error(err);
          res.send('Error saving the student.'); // Handle errors appropriately
      });
});
app.get('/logout', (req, res) => {
  // Call req.logout() to terminate the user's login session
  
  // Redirect the user to a login or home page
  res.redirect('/');
});


app.get('/studentsList', async (req, res) => {
  try {
      // Fetch the list of students from the database
      const students = await Student.find({}).exec();

      // Render an EJS view to display the list of students
      res.render('studentList', { students });
  } catch (err) {
      console.error(err);
      // Handle errors appropriately
      res.render('error'); // Render an error page
  }
});
app.get('/addStudent', (req, res) => {
  res.render('addStudent'); // Render the addStudent EJS view
});


app.get('/interviews/create', (req, res) => {
  res.render('addInterview', { title: 'Add Interview' });
});

// Handle the form submission for adding an interview
app.post('/interviews/create', (req, res) => {
  const { companyName, position, techStack, salary, jobDescription, date } = req.body;

  // Validate form data (you can use a validation library such as express-validator)

  // Create a new interview instance and save it to the database
  const newInterview = new Interview({
    companyName,
    position,
    techStack: techStack.split(','), // Convert techStack to an array
    salary,
    jobDescription,
    date,
  });

  newInterview.save()
    .then((interview) => {
      console.log('Interview added:', interview);
      res.redirect('/interviews'); // Redirect to the list of interviews
    })
    .catch((error) => {
      console.error('Error adding interview:', error);
      // Handle errors or show an error message
    });
});

app.get('/interviews', (req, res) => {
  Interview.find({}).exec()
    .then((interviews) => {
      res.render('listInterview', { title: 'List of Interviews', interviews });
    })
    .catch((error) => {
      console.error('Error retrieving interviews:', error);
      // Handle errors or show an error message
    });
});
app.get('/view-interviews', async (req, res) => {
  try {
    // Fetch interviews along with allocated students
    const interviews = await Interview.find().populate('allocatedStudents');

    res.json(interviews);
  } catch (err) {
    console.error('Error fetching interviews:', err);
    res.status(500).send('Internal Server Error');
  }
});




app.get('/allocate-student', async (req, res) => {
  try {
    const students = await Student.find({}); // Fetch the list of students from your database

    const interviews = await Interview.find({}).exec(); // Fetch the list of interviews

    res.render('allocate', { title: 'Allocate Student', interviews, students });
  } catch (error) {
    console.error('Error retrieving data:', error);
    // Handle errors or show an error message
    res.status(500).send('Internal Server Error');
  }
});



// Import the "Result" model

app.post('/allocate-student', async (req, res) => {
  const { interview, studentName, status } = req.body;

  try {
    // Create a new "Result" document
    const newResult = new Result({
      interview: interview, // Assuming interview is a valid ObjectId
      student: studentName, // Assuming studentName is a valid ObjectId
      status: status, // Should be 'Pass', 'Fail', or 'Pending'
    });

    // Save the new "Result" document to the database
    await newResult.save();

    console.log('Student allocated to interview:', newResult);

    // Redirect to the 'view-allocated-students' route
    res.redirect('/view-allocated-students');

  } catch (err) {
    console.error('Error allocating student:', err);
    // Handle errors or show an error message
    res.status(500).send('Internal Server Error');
  }
});










app.get('/view-allocated-students', async (req, res) => {
  try {
    // Fetch the list of allocated students and their details from the database
    const allocatedStudents = await Result.find()
      .populate('interview')
      .populate('student')
      .exec();

    res.render('result', { title: 'View Allocated Students', allocatedStudents });
  } catch (error) {
    console.error('Error retrieving allocated students:', error);
    // Handle errors or show an error message
    res.status(500).send('Internal Server Error');
  }
});






app.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
