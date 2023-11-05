// models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  college: String,
  status: String,
  dsaFinalScore: Number,
  webDFinalScore: Number,
  reactFinalScore: Number,
  interviews: [
    {
      company: String,
      date: Date,
    },
  ],
  results: [
    {
      company: String,
      result: String,
    },
  ],
});

module.exports = mongoose.model('Student', studentSchema);
