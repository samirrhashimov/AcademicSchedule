import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'E-poçt yanlışdır.'],
  },
  passwordHash: { type: String, required: true },
  resetTokenHash: { type: String, default: null },
  resetTokenExpires: { type: Date, default: null },
}, { timestamps: true })

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = String(ret._id)
    delete ret._id
    delete ret.passwordHash
    delete ret.resetTokenHash
    delete ret.resetTokenExpires
  },
})

export const User = mongoose.model('User', userSchema)
