import mongoose from "mongoose";

const { MONGO_USER, MONGO_PASS, MONGO_HOST, MONGO_PORT } = process.env;
const username = (MONGO_USER && MONGO_USER + ":") || "";
const password = (MONGO_PASS && MONGO_PASS + "@") || "";
const dbhost = MONGO_HOST || "127.0.0.1";
const port = MONGO_PORT || 27017;
const name = "hodler_visits";

mongoose.connect(
  `mongodb://${username}${password}${dbhost}:${port}/${name}`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  },
  (err) => {
    if (err) return console.log(err);
    console.log("db connected", name);
  }
);
