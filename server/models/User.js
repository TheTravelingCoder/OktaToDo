const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    jwt: {
        type: String
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;