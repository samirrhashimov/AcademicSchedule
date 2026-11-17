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
  downloads: { type: Number, default: 0 },
  subjects: { type: [mongoose.Schema.Types.Mixed], default: [] },
  createdBy: { type: String, index: true },
  expiresAt: { type: Date, default: null },
}, { timestamps: true })

// Vaxtı keçən şablonları Mongo özü silir (DB şişmir).
templateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const Template = mongoose.model('Template', templateSchema)
