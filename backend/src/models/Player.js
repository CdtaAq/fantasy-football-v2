const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: String,
  team: String,
  position: String,
  stats: {
    passingYards: Number,
    rushingYards: Number,
    touchdowns: Number
  }
}, { timestamps: true });

module.exports = mongoose.model("Player", playerSchema);
