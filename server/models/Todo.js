const mongoose = require('mongoose');

const TodoSchema = new mongoose.Schema({
    todo: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    }
});

const ToDo = mongoose.model('ToDo', TodoSchema);

module.exports = ToDo;