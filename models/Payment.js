import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    shiftCount: { type: Number, required: true },
    ms: { type: Number, required: true }, // total worked time covered by this payment
    amount: { type: Number, required: true }, // earned from those shifts
    adjustment: { type: Number, default: 0 }, // bonus (+) or deduction (-)
    total: { type: Number, required: true }, // amount + adjustment = what was actually handed over
    method: { type: String, enum: ["cash", "bkash", "nagad"], required: true },
    trxId: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
    paidAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
