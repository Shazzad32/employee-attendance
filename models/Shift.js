import mongoose from "mongoose";

const ShiftSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, default: null },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null, index: true }, // set once this shift is paid
    rateAtTime: { type: Number, required: true, min: 0 }, // rate when the shift started, so later rate changes don't alter old pay
  },
  { timestamps: true }
);

export default mongoose.models.Shift || mongoose.model("Shift", ShiftSchema);
