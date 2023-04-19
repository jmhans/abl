let mongoose = require('mongoose')

var postSchema = new mongoose.Schema({
  title: {type: String, required: false},
  author: {type: mongoose.Schema.Types.ObjectId, ref:'Owner', required: false},
  content: {type: String, required: false},
  replies: [{content: {type: String, required: false},
            author: {type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: false}}]

})

module.exports = mongoose.model('post', postSchema);
