const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    resetlink: { type: String, default: "" },
    image: { type: String },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: [8, "Password must be at least 8 characters long"],
    },
    phonenum: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Please provide a valid phone number"],
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      zip: {
        type: String,
        match: [/^\d{5}$/, "Please provide a valid zip code"],
      },
    },
    purchased_services: [
      {
        uniqueid: { type: String, default: "" },
        description: String,
        location: String,
        jobDate: Date,
        deadline: Date,
        payment: Boolean,
        status: {
          type: String,
          enum: ["pending", "completed", "in_progress", "canceled"],
        },
        jobType: { type: String },
        professional: {
          name: String,
          phone: String,
          email: String,
        },
        feedback: {
          text: { type: String, default: "" },
          rating: { type: Number, min: 0, max: 5, default: null },
        },
      },
    ],
  },
  { collection: "customers" }
);

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
