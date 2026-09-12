const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
      required: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.seedDefaultUsers = async function () {
  const adminEmail = 'admin123@gmail.com';
  const userEmail = 'user@lawintel.uk';

  // Seed or update the Single Admin ID
  let existingAdmin = await this.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    await this.create({
      email: adminEmail,
      passwordHash: hash,
      name: 'System Administrator',
      role: 'admin'
    });
  } else if (existingAdmin.role !== 'admin') {
    existingAdmin.role = 'admin';
    await existingAdmin.save();
  }

  const existingUser = await this.findOne({ email: userEmail });
  if (!existingUser) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('User123!', salt);
    await this.create({
      email: userEmail,
      passwordHash: hash,
      name: 'Associate Legal Researcher',
      role: 'user'
    });
  }
};

module.exports = mongoose.model('User', userSchema);
