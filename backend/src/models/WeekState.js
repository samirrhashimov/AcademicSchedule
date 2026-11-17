import mongoose from 'mongoose'

const weekStateSchema = new mongoose.Schema({
  key: { type: String, required: true, default: 'default' },
  userId: { type: String, index: true },
  anchorWeekStart: { type: String, required: true },
  anchorMode: { type: String, enum: ['upper-week', 'lower-week'], required: true },
  overrides: { type: Object, default: {} },
  system: { type: String, enum: ['single', 'double'], default: 'double' },
}, { timestamps: true })

weekStateSchema.index({ key: 1, userId: 1 }, { unique: true })

weekStateSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id
  },
})

export const WeekState = mongoose.model('WeekState', weekStateSchema)
