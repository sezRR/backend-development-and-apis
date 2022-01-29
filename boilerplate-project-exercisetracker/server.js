const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const bodyParser = require('body-parser')

const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const { Schema } = mongoose

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const mongoConnectionString = process.env['MONGO_URI']
mongoose.connect(mongoConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new Schema({
  username: { type: String, required: true }
})

const User = mongoose.model("User", userSchema)

const exerciseSchema = new Schema({
  _id: String,
  custom_id: String,
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date,
})

const Exercise = mongoose.model("Exercise", exerciseSchema)

const logSchema = new Schema({
  _id: String,
  username: String,
  from: String,
  to: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
}, {_id: false})

const Log = mongoose.model("Log", logSchema)

app.use(bodyParser.urlencoded({ extended: true }))
app.post("/api/users", (req, res) => {
  let user = new User({
    username: req.body.username
  })

  user.save((err, newUser) => {
    if (err) return console.error(err)
    return res.json({
      _id: newUser._id,
      username: newUser.username
    })
  })
})

app.get("/api/users", (req, res) => {
  User.find((err, data) => {
    return res.json(data)
  })
})

app.post("/api/users/:id/exercises", (req, res) => {
  User.findById(req.params.id, (err, user) => {
    let exercise = new Exercise({
      _id: null,
      custom_id: user._id,
      username: user.username,
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: new Date(req.body.date).toDateString().toString()
    })

    if (!Date.parse(exercise.date)) exercise.date = new Date().toDateString()

    exercise.save((err, newExercise) => {
      if (err) return console.error(err)

      return res.json({
        _id: newExercise.custom_id,
        username: newExercise.username,
        description: newExercise.description,
        duration: newExercise.duration,
        date: newExercise.date.toDateString().toString()
      })
    })
  })
})

app.get("/api/users/:_id/logs", (req, res) => {
    const gteDate = new Date(req.query.from)
    const ltDate = new Date(req.query.to)
    const limit = parseInt(req.query.limit)

    let query =  [{ $match: { "custom_id": req.params._id }}]
    if ((req.query.limit !== undefined && limit > 0) 
    && (!isNaN(gteDate.getTime() && !isNaN(ltDate.getTime())))){
      query = [{ $match: { "custom_id": req.params._id, "date": { $gte:gteDate, $lt:ltDate }}}, {$limit: limit}]
    } else if (!isNaN(gteDate.getTime() && !isNaN(ltDate.getTime()))) {
      query = [{ $match: { "custom_id": req.params._id, "date": { $gte:gteDate, $lt:ltDate }}}]
    } else if (limit > 0 && (isNaN(gteDate.getTime() && isNaN(ltDate.getTime())))) {
      query = [{ $match: { "custom_id": req.params._id}}, {$limit: limit}]
    }

    Exercise.aggregate(query, (err, dataExercise) => {
    if (err) return console.error(err)

    User.findOne({_id: req.params._id}, (err, dataUser) => {
      if (err) return console.error(err)
      if (dataUser === null) return res.json({user: "Not found"})

      var log = new Log({
        _id: req.params._id,
        username: dataUser.username,
        from: gteDate.toDateString(),
        to: ltDate.toDateString(),
        count: 0,
        log: []
      })

      if (dataExercise.length === 0) return res.json(log)

      if (isNaN(gteDate.getTime()) || isNaN(ltDate.getTime())) {
        log.from = undefined
        log.to = undefined
      }

      log.count = dataExercise.length
      for (var i = 0; i < dataExercise.length; i++) {
        log.log.push({
          description: dataExercise[i].description,
          duration: dataExercise[i].duration,
          date: dataExercise[i].date.toDateString()
        })
      }

      return res.json(log)
    })
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
