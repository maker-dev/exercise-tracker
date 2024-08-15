const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require("mongoose");
const User = require("./models/User");

//config
require('dotenv').config()

//database connection
mongoose.connect(process.env.DB_URI);

//middlewares
app.use(cors())
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(express.static('public'))

//routes

//@description     serve an html page
//@route           GET /
//@access          Public
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//@description     Create New User
//@route           POST /api/users
//@access          Public
app.post("/api/users", async (req, res) => {
  const {username} = req.body;
  
  if (!username) return res.send({error: "username is required"});

  const newUser = new User({
      username
  })

  await newUser.save();

  res.send({username, _id: newUser._id});

})

//@description     Get All Users
//@route           GET /api/users
//@access          Public
app.get("/api/users", async (req, res) => {
  const users = await User.find().select("username _id")

  res.send(users);
})

//@description     Add New Exercise to a User
//@route           POST /api/users/:_id/exercises
//@access          Public
app.post("/api/users/:_id/exercises", async (req, res) => {
    
  //get user data
  const {_id} = req.params;
  const {description, duration, date} = req.body;

  //input validation
  if (!mongoose.Types.ObjectId.isValid(_id)) return res.send({error: "your id must be valid"})
  else if (!description) return res.send({error: "description is required"})
  else if (!Number.isInteger(+duration)) return res.send({error: "duration must be integer"})

  try {

    const user = await User.findById(_id);

    let newExercise = date ? {
      description,
      duration,
      date
    } : {
      description,
      duration
    };

    user.exercises.push(newExercise);

    await user.save();

    res.send({
        username: user.username,
        description,
        duration: Number(duration),
        date: date ? new Date(date).toDateString() : new Date().toDateString(),
        _id
    });

  } catch (err) {
    res.send({error: "internal Error: " + err.message})
  }

})

//@description     Get All Exercise From a User
//@route           GET /api/users/:_id/logs
//@access          Public
app.get("/api/users/:_id/logs", async (req, res) => {
  const {_id} = req.params;
  const {from, to, limit} = req.query;

  const fromDate = from ? new Date(from) : null;
  const toDate   = to   ? new Date(to) : null;

  try {

    const user = await User
                          .findById(_id)
                          .select("-exercises._id");

    if (!user.exercises) return res.send({error: "No Exercises Found"});


    //filtering with date
    let logs = user.exercises.filter(exercise => {
      const exerciseDate = new Date(exercise.date); // Ensure exercise.date is a Date object

      // Check if exercise.date is within the specified range
      const isAfterFromDate = !fromDate || exerciseDate >= fromDate;
      const isBeforeToDate = !toDate || exerciseDate <= toDate;

      return isAfterFromDate && isBeforeToDate;
    })


    //changing date format
    logs = logs.map(exercise => {
      return {
        ...exercise.toObject(),
        date: new Date(exercise.date).toDateString()
      }
    });


    res.send({
      _id: user._id,
      username: user.username,
      count: user.exercises.length,
      log: limit ? logs.slice(0, +limit) : logs
    });

  } catch (err) {
    res.send({error: "internal Error: " + err.message})
  }
})

//server listener
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
