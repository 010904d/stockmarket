import mongoose from "mongoose";
const Schema = mongoose.Schema;

const PredictionSchema = new Schema({
  symbol: { type: String, required: true },
  start: String,
  end: String,
  data: { type: Array, default: [] }
}, { timestamps: true });

export default mongoose.model("Prediction", PredictionSchema);
