var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var hbs = require("handlebars");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static(process.cwd() + "/public"));
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

//Handlebars each_upto helper
hbs.registerHelper('each_upto', function(ary, max, options) {
  if(!ary || ary.length == 0)
      return options.inverse(this);

  var result = [ ];
  for(var i = 0; i < max && i < ary.length; ++i)
      result.push(options.fn(ary[i]));
  return result.join('');
});

var PORT = process.env.PORT || 3000;
mongoose.Promise = Promise;
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.01/mongoScraper";
mongoose.connect(MONGODB_URI);

// Routes

// Route for getting all saved Articles from the db
app.get("/", function(req, res) {
  db.Article
    .find({saved: false})
    .then(function(dbArticle) {
      var hbsObject = {
        articles: dbArticle
      };
      res.render("index", hbsObject);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// A GET route for scraping the nytimes science website
app.get("/scrape", function(req, res) {
  var counter = 0;
  axios.get("https://www.nytimes.com/section/science").then(function(response) {

    var $ = cheerio.load(response.data);

    $("article.story").each(function(i, element) {

      var result = {};

      result.link = $(this).find("a").attr("href");
      result.title = $(this).find("h2").text().trim();
      result.summary = $(this).find("p.summary").text();
      result.image = $(this).find("a").find("img").attr("src");
      result.saved = false;

      if (result.title && result.link && result.summary) {
        counter++;
        db.Article
        .create(result)
        .then(function(dbArticle) {
          res.send("You've scraped " + counter + " articles!");
        })
        .catch(function(err) {
          res.json(err);
        });
      };
    });
  });
});

// Route for grabbing a specific Article by id, update status to "saved"
app.post("/save/:id", function(req, res) {
  db.Article
    .update({ _id: req.params.id }, { $set: {saved: true}})
    .then(function(dbArticle) {
      res.json("dbArticle");
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, update status to "unsaved"
app.post("/unsave/:id", function(req, res) {
  db.Article
    .update({ _id: req.params.id }, { $set: {saved: false}})
    .then(function(dbArticle) {
      res.json("dbArticle");
    })
    .catch(function(err) {
      res.json(err);
    });
});

//Route to render Articles to handlebars and populate with saved articles
app.get("/saved", function(req, res) {
  db.Article
  .find({ saved: true })
  .then(function(dbArticles) {
    var hbsObject = {
      articles: dbArticles
    };
    res.render("saved", hbsObject);
  })
  .catch(function(err){
    res.json(err);
  });
});


//get route to retrieve all notes for a particlular article
app.get('/getNotes/:id', function (req,res){
  db.Article
    .findOne({ _id: req.params.id })
    .populate('note')
    .then(function(dbArticle){
      res.json(dbArticle);
    })
    .catch(function(err){
      res.json(err);
    });
});

//post route to create a new note in the database
app.post('/createNote/:id', function (req,res){
  db.Note
    .create(req.body)
    .then(function(dbNote){
      return db.Article.findOneAndUpdate( {_id: req.params.id }, { note: dbNote._id }, { new:true });//saving reference to note in corresponding article
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
