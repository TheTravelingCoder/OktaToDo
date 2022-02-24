const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const passport = require("passport");
const crypto = require("crypto-js");
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Configs
const config = require("../config/keys");

// Controllers
const loginController = require('../controllers/login');

// Models
const User = require('../models/User');


// Transporter for nodemail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
      user: config.GMAIL_USER,
      pass: config.GMAIL_PASS,
  }
});

// Routes for Login
router.get('/confirmation/:token', (req, res) => {//Reads all the files in /public/thumbnails/ directory
  loginController.tokenConfirmation(req, res);
});

router.post('/login', (req, res) => {
  loginController.login(req, res);
});

router.post('/addTodo', (req, res) => {
  loginController.addTodo(req, res);
});

router.post('/getTodo', (req, res) => {
  loginController.getTodo(req, res);
});

router.post('/deleteTodo', (req, res) => {
  loginController.deleteTodo(req, res);
});

/////////////////
//Google Oauth //
/////////////////
router.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    let randomString = uuidv4();
    let token = jwt.sign(randomString, "SoSoSecretMyGuy");
    res.status(200).send(token);
    return;
  });
router.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile',
                                            'https://www.googleapis.com/auth/userinfo.email'] }));

module.exports = router;