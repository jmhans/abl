let mongoose = require('mongoose')

var postSchema = new mongoose.Schema({
  title: {type: String, required: false},
  author: {type: String, required: false},
  content: {type: String, required: false},
  timestamp: {type: Date, required: false},
  replies: [{content: {type: String, required: false},
            author: {type: String, required: false},
          timestamp: {type: Date, required: false}}]

})

module.exports = mongoose.model('post', postSchema);
