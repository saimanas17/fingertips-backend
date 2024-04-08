const bcrypt = require("bcryptjs");
const Professional = require("../model/professional");
const Service = require("../model/service");
const Customer = require("../model/customer");
const multer = require("multer");
const path = require("path");
const services = async (req, res) => {
  try {
    const professionalEmail = req.params.professionalemail;

    // Find all services where the professionalEmail matches
    const services = await Service.find({ professionalEmail });

    res.json(services); // Return the found services
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createUser = async (req, res) => {
  try {
    const userData = req.body;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,}$/;
    if (!passwordRegex.test(userData.password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
      });
    }

    // Validate phone number
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(userData.phonenum)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    // Validate zip code
    const zipRegex = /^\d{5}$/;
    if (!zipRegex.test(userData.address.zip)) {
      return res.status(400).json({ message: "Invalid zip code format" });
    }

    // Check if the email already exists
    const existingUser = await Professional.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create a new professional user
    const newUser = new Professional({
      firstname: userData.firstname,
      lastname: userData.lastname,
      email: userData.email,
      profession: userData.profession,
      dob: userData.dob,
      password: hashedPassword,
      phonenum: userData.phonenum,
      address: {
        line1: userData.address.line1,
        line2: userData.address.line2,
        city: userData.address.city,
        state: userData.address.state,
        zip: userData.address.zip,
      },
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const addNoteFromProfessional = async (req, res) => {
  try {
    const { serviceId } = req.params; // Extract service ID from request params
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }
    const { text } = req.body; // Extract note text from request body
    const professionalEmail = service.professionalEmail; // Extract professional email from authenticated user
    const professional = await Professional.findOne({
      email: professionalEmail,
    });
    // Add the note to the service document
    service.notes.push({
      text,
      author: professional.firstname + " " + professional.lastname,
    });

    // Save the updated service document
    await service.save();

    res.status(200).json(service); // Return the updated service document
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const changeJobStatus = async (req, res) => {
  try {
    const { serviceId, newStatus } = req.body;

    // Update the service document
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    service.status = newStatus;
    await service.save();

    // Update the professional document
    const professional = await Professional.findOne({
      email: service.professionalEmail,
    });

    if (!professional) {
      return res.status(404).json({ error: "Professional not found" });
    }
    const client = await Customer.findOne({ email: service.customerEmail });

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    const uiq = service.uniqueid;
    // Find the index of the service in the professional's jobs array
    professional.jobs.forEach((job, index) => {
      // Check if client email matches cEmail
      if (job.uniqueid === uiq) {
        // Update feedback for the matching job
        professional.jobs[index].status = newStatus;
      }
    });
    client.purchased_services.forEach((job, index) => {
      if (job.uniqueid == uiq) {
        client.purchased_services[index].status = newStatus;
      }
    });

    await client.save();
    await professional.save();

    res.status(200).json({ message: "Job status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const giveFeedbackfromprotocustomer = async (req, res) => {
  try {
    const { serviceId, text, rating } = req.body;

    // Find the service by ID
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const customerEmail = service.customerEmail;
    // Update the feedback in the service document
    service.professionalFeedback = { text, rating };

    // Save the updated service document
    await service.save();

    const client = await Customer.findOne({ email: customerEmail });

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    const uiq = service.uniqueid;
    // Find the index of the service in the professional's jobs array
    client.purchased_services.forEach((job, index) => {
      if (job.uniqueid == uiq) {
        client.purchased_services[index].feedback = { text, rating };
      }
    });

    await client.save();

    res.status(200).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProfessionalByEmail = async (req, res) => {
  const { email } = req.params; // Extracting email from route parameters

  try {
    // Find the professional by email
    const professional = await Professional.findOne({ email });

    if (!professional) {
      return res.status(404).json({ message: "Professional not found" });
    }

    res.status(200).json({ professional });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getAllProfessionals = async (req, res) => {
  try {
    // Find all professionals
    const professionals = await Professional.find();

    res.status(200).json({ professionals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/usr/src/app/professional-images");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});
const upload = multer({ storage: storage });

// Middleware to handle file upload
const uploadImage = upload.single("image");
const editProfessional = async (req, res) => {
  const { email } = req.params; // Extracting email from route parameters

  // Destructuring request body for editable fields
  const { firstname, lastname, password, phonenum, address } = req.body;

  try {
    // Find the professional by email
    let professional = await Professional.findOne({ email });

    if (!professional) {
      return res.status(404).json({ message: "Professional not found" });
    }

    // Update editable fields if they are provided in the request
    if (firstname) professional.firstname = firstname;
    if (lastname) professional.lastname = lastname;
    if (password) professional.password = password;
    if (phonenum) professional.phonenum = phonenum;
    if (address) professional.address = address;
    uploadImage(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "Error uploading image" });
      } else if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }

      // If image uploaded successfully, update customer's image field
      if (req.file) {
        professional.image = req.file.filename;
      }

      // Save the updated customer
      await professional.save();

      res.status(200).json({
        message: "Professional details updated successfully",
        professional,
      });
    });
    // Save the updated professional
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createUser,
  services,
  addNoteFromProfessional,
  changeJobStatus,
  giveFeedbackfromprotocustomer,
  getProfessionalByEmail,
  getAllProfessionals,
  editProfessional,
};
