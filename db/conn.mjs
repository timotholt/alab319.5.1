import mongoose from "mongoose";
import "dotenv/config";

// Get rid of those annoying warnings
mongoose.connect(process.env.ATLAS_URI); //, { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to mongoose!
const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to the database");
});

export default db;

