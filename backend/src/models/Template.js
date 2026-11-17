import mongoose from 'mongoose'

const templateSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: { type: String, default: '' },
  subjects: { type: [mongoose.Schema.Types.Mixed], default: [] },
  createdBy: { type: String, index: true },
}, { timestamps: true })

export const Template = mongoose.model('Template', templateSchema)
