const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
var bodyParser = require('body-parser')
require('dotenv').config()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
console.log(process.env.DB_URI)
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
let schema = mongoose.Schema;

let user = new schema({ username: { type: String, required: true } })


const User = mongoose.model("User", user);
const exerciseSchema = new schema({
  user_id: {
    type: String,
    required: true
  },
  description: String,
  duration: Number,
  date: Date
}, {
  versionKey: false // This option removes the version key
});
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.post("/api/users", async (req, res) => {





  try {
    let newUser = new User({ username: req.body.username });
    await newUser.save();
    res.json({ username: newUser.username, _id: newUser._id })

  } catch (err) {
    res.json({ err: err })
    console.log(err)

  }





});

app.get("/api/users", async (req, res) => {
  let data = await User.find({});
  // await User.deleteMany({})

  return res.json(data)
})


app.post('/api/users/:_id/exercises/', async (req, res) => {
  const { description, duration, date } = req.body;
  let id = req.params._id;
  console.log(id)
  try {
    const user = await User.findById(id);
    console.log(user)
    if (!user) {
      return res.json({ err: "no user found" });

    }
    let exerciseObj = new Exercise({ user_id: id, description, duration, date: date ? new Date(date) : new Date() });

     exerciseObj=await exerciseObj.save();

    return res.json({
      _id:user._id,
      username:user.username,
      description: exerciseObj.description,
      duration: exerciseObj.duration,
      date: new Date(exerciseObj.date).toDateString()
      
    })

   

  } catch (err) {
    return res.json(err)

  }


})

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if (!user) {
    return res.json({ err: "no user" })
  }
  let dateObj = {};
  if (from) {
    dateObj["$gte"] = new Date(from)
  }
  if (to) {
    dateObj["$lte"] = new Date(to)
  }
  let filter = {
    user_id: id

  }
  if (from || to) {
    filter.date = dateObj;

  }
  const exercise = await Exercise.find(filter).limit(+limit ?? 500);
  const log = exercise.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString(),

  }))
  return res.json({
    username: user.username,
    count: exercise.length,
    _id: user._id,
    log
  })



})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
