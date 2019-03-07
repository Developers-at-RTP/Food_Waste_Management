// Install Dependencies
const express = require("express");
const bodyParser = require("body-parser");

const { Users } = require("./userModel");

// Setup Dependencies
const router = express.Router();
const jsonParser = bodyParser.json();

// Routing
router.get(`/`, (req, res) => {
  const filters = {};
  const queryableFields = [`userName`]; // May apply other filters, so making an array.
  queryableFields.forEach(field => {
    if (req.query[field]) {
      filters[field] = req.query[field];
    }
  });

  Users.find(filters)
    .then(users => {
      res.status(200).json(users.map(user => user.serialize()));
    })
    .catch(err => {
      return res.status(500).json({ message: `Internal Server Error` });
    });
});

router.get(`/:id`, (req, res) => {
  Users.findOne({ "_id": req.params.id })
    .then(user => {
      res.status(200).json(user.serialize());
    })
    .catch(err => {
      return res.status(500).json({ message: `Internal Server Error` });
    });
});

router.post(`/`, jsonParser, (req, res) => {
  console.log(req.body);
  const errorMessage = checkPostRequestForErrors(req);
  if (errorMessage.length > 0) {
    return res.status(422).json(errorMessage);
  }

  Users.create({
    userName: req.body.userName,
    userPassword: req.body.userPassword
  })
    .then(user => res.status(201).json(user.serialize())) // Opted to return the poster's information back to poster.
    .catch(err => {
      const message = `Failed to create user.`;
      console.log("err=", err);
      return res.status(400).send(message);
    });
});

router.put(`/:id`, jsonParser, (req, res) => {
  if (
    !(req.params.id && req.body.userId && req.params.id === req.body.userId)
  ) {
    const msg = `${req.params.id} and ${req.body.userId} not the same.`;
    return res.status(400).json({ message: msg });
  }

  const errorMessage = checkPostRequestForErrors(req); // Using same filter process as post requests.
  if (errorMessage.length > 0) {
    return res.status(422).json(errorMessage);
  }

  const toUpdate = {};
  const updateableFields = [`userPassword`, `userName`];
  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Users.updateOne({ "_id": req.params.id }, { $set: toUpdate })
    .then(() => res.status(204).end())
    .catch(error => {
      return res.status(400).send(error);
    });
});

router.delete(`/:id`, (req, res) => {
  Users.deleteOne({ "_id": req.params.id })
    .then(() => res.status(204).end())
    .catch(error => {
      res.status(400).send(error);
    });
});

router.use("*", function (req, res) {
  res.status(404).json({ message: "Routing Not Found." });
});

// Helper functions
function checkPostRequestForErrors(req) {
  // Checks fields to make sure standards are met.  Including: having required fields, certain fields are strings, userName and userPassword
  // are explicitly trimmed, userName and userPassword adhere to character length requirements, and userName is unique in database.
  // Returns the array errorMessage, which populates only if errors occur.
  const requiredFields = [`userName`, `userPassword`];
  const stringFields = ["userName", "userPassword"];
  const explicitlyTrimmedFields = ["userName", "userPassword"]; // Does not start or end with whitespace.
  const sizedFields = {
    userName: { min: 4 },
    userPassword: { min: 10, max: 72 }
    // may use bcrypt, which truncates after 72 characters, so let's not give the illusion of security by storing extra (unused) info.
  };

  let errorMessage = [];

  requiredFields.forEach(field => {
    if (req.body.method === "POST") {
      // See note at bottom, need to check if req.body.method is the right route.
      if (!(field in req.body)) {
        errorMessage.push({
          message: `The field ${field} is missing from the request.`,
          field: field
        });
      }
    }
  });

  stringFields.forEach(field => {
    if (field in req.body && typeof req.body[field] !== "string") {
      errorMessage.push({
        message: `The field ${field} is not a string.`,
        field: field
      });
    }
  });

  explicitlyTrimmedFields.forEach(field => {
    if (field in req.body && req.body[field].trim() !== req.body[field]) {
      errorMessage.push({
        message: `The field ${field} cannot not start or end with whitespace.`,
        field: field
      });
    }
  });

  Object.keys(sizedFields).forEach(field => {
    if (
      "min" in sizedFields[field] &&
      req.body[field] &&
      req.body[field].trim().length < sizedFields[field].min
    ) {
      errorMessage.push({
        message: `The field ${field} must be more than ${
          sizedFields[field].min
          } characters.`,
        field: field
      });
    }
  });
  Object.keys(sizedFields).forEach(field => {
    if (
      "max" in sizedFields[field] &&
      req.body[field] &&
      req.body[field].trim().length > sizedFields[field].max
    ) {
      errorMessage.push({
        message: `The field ${field} must be less than ${
          sizedFields[field].max
          } characters.`,
        field: field
      });
    }
  });

  // Is userName already in the database? Must be unqiue.
  Users.find({ userName: req.body.userName })
    .countDocuments()
    .then(count => {
      if (count > 0) {
        errorMessage.push({
          message: `That userName is already taken. The userName must be unique.`,
          field: `userName`
        });
      }
    })
    .catch(err => {
      err.push({
        message: `Server currently down. Please try again later.`,
        field: null
      });
    });

  return errorMessage;
}

// Export
module.exports = router;

/* -- Notes for potential concerns in use --

Currently using checkPostRequestForErrors(req) for both post and put (updtate) requests.  Put requests may not update every field,
so the "requiredFields" criteria would not be met. I need to make sure that if(req.body.method === "POST") line is expressed properly.
*/
