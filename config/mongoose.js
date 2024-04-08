const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://admin:admin@cluster0.tvlrurm.mongodb.net/fingertips"
);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "Error in connecting to dB"));

db.once("open", function () {
  console.log("Connected to database :: MongoDB");
});
module.exports = db;
