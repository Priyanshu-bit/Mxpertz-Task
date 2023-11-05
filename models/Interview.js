const mongoose = require('mongoose');

// Define the Interview schema
const interviewSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  position: {
    type: String,
    required: true,
    trim: true,
  },
  techStack: {
    type: [String],
    required: true,
  },
  salary: {
    type: Number,
    required: true,
  },
  jobDescription: {
    type: String,
    required: true,
  },
  date: {
    type: Date, // Use the Date type for the date field
    required: true,
  },
});

// Create a model from the schema
const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;
