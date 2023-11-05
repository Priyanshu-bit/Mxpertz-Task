const express = require("express");
const app = express();
const database = require("./database/database.js");
const { connectMongoose } = database;

const ejs = require("ejs");
const path = require("path");
const passport = require("passport");
const { initializingPassport, isauthenticated } = require("./passConfig.js");
const expressSession = require("express-session");
const User = require("./models/user.js");
const Interview = require("./models/Interview.js");
const Student = require("./models/student.js");
const cors = require('cors');








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




app.get("/", (req, res) => {
  res.render("index");
});

app.post("/api/register", async (req, res) => {
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
    successRedirect: "/profile", // Redirect on successful login
    failureRedirect: "/register", // Redirect on failed login
  })
);

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/profile", isauthenticated, (req, res) => {
  res.send(req.user);
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


app.get('/students', async (req, res) => {
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



app.get('/allocate-student', (req, res) => {
  Interview.find({}).exec() // Use .exec() to return a promise
    .then((interviews) => {
      res.render('allocate', { title: 'Allocate Student', interviews });
    })
    .catch((error) => {
      console.error('Error retrieving interviews:', error);
      // Handle errors or show an error message
    });
});


app.post('/allocate-student', (req, res) => {
  const { interview, studentName } = req.body;

  // Find the selected interview by its ID and update it
  Interview.findOneAndUpdate(
    { _id: interview },
    { $push: { allocatedStudents: studentName } },
    (err, interview) => {
      if (err) {
        console.error('Error allocating student:', err);
        // Handle errors or show an error message
      } else {
        console.log('Student allocated to interview:', interview);
        // Redirect to a success page or display a success message
      }
    }
  );
});




app.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
