const mongoose = require(`mongoose`);
const connection = mongoose.createConnection('mongodb://localhost/food-waste-db');

// Correction provided by https://github.com/Automattic/mongoose/issues/6880 to remove deprication notes.
// See also https://bit.ly/2H7dTdB 
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const UserSchema = mongoose.Schema({
  userId: { type: String },
  userName: { type: String, required: true, unique: true },
  userPassword: { type: String, required: true }
});

UserSchema.methods.serialize = function () {
  return {
    userId: this._id,
    userName: this.userName
  };
};

const Users = connection.model(`users`, UserSchema);

module.exports = { Users };
