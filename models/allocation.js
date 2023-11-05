const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  interview: {
    companyName: String, // Add company name
    position: String,   // Add position
    type: mongoose.Schema.Types.ObjectId, ref: 'Interview',
    required: true
  },
  student: {
    name: String,       // Add student name
    type: mongoose.Schema.Types.ObjectId, ref: 'Student',
    required: true
  },
  status: {
    type: String,
    enum: ['Pass', 'Fail', 'Pending'], // Include status
    required: true
  },
});

module.exports = mongoose.model('Result', resultSchema);
