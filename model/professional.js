const mongoose = require("mongoose");

const professionalSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    profession: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phonenum: {
      type: String,
      required: true,
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      zip: String,
    },

    isAuth: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "professional",
    },
    resetlink: { type: String, default: "" },
    image: { type: String },
    avgrating: {
      type: Number,
      default: 0,
    },
    jobs: [
      {
        uniqueid: { type: String, default: "" },
        description: String,
        location: String,
        job_date: Date,
        deadline: Date,
        status: {
          type: String,
          enum: ["pending", "completed", "in_progress", "canceled"],
        },
        payment: Boolean,
        payamount: String,
        client: {
          name: String,
          phone: String,
          email: String,
        },
        feedback: {
          text: String,
          rating: {
            type: Number,
            min: 0,
            max: 5,
          },
        },
      },
    ],
  },
  { collection: "professionals" }
);

// Create Professional model
const Professional = mongoose.model("Professional", professionalSchema);

// Export the model
module.exports = Professional;
