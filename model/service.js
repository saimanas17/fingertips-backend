const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    customerEmail: {
      type: String,
      required: true,
    },
    professionalEmail: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    uniqueid: { type: String, default: "" },
    jobDate: {
      type: Date,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    payment: {
      type: Boolean,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "in_progress", "canceled"],
      default: "pending",
    },
    notes: [
      {
        text: String,
        author: {
          type: String,
        },
      },
    ],
    customerFeedback: {
      text: {
        type: String,
      },
      rating: {
        type: Number,
        min: 0,
        max: 5,
      },
    },
    professionalFeedback: {
      text: {
        type: String,
      },
      rating: {
        type: Number,
        min: 0,
        max: 5,
      },
    },
  },
  { timestamps: true, collection: "service" }
);

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
