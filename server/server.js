const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');

const app = express();

// DB Config
const db = require('./config/keys').MongoURI;

//User Model
const User = require('./models/User');

// Express Session
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
}));

// Connect to Mongo
mongoose.connect(db, { useUnifiedTopology: true, useNewUrlParser:true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

//Allows Cors
app.use(cors());

// Allows Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Routes
app.use('/', require('./routes/index'));

const port = 5000;
app.listen(port, () => `Server running on port ${port}`);