import mongoose from 'mongoose'

const lessonSchema = new mongoose.Schema({
  day: { type: String, required: true, trim: true },
  startTime: { type: String, required: true, trim: true },
  endTime: { type: String, required: true, trim: true },
}, { _id: false })

const subjectSchema = new mongoose.Schema({
  _id: { type: String },
  userId: { type: String, index: true },
  name: { type: String, required: true, trim: true },
  lectureCount: { type: Number, required: true, min: 0 },
  seminarCount: { type: Number, required: true, min: 0 },
  frequency: { type: String, enum: ['every-week', 'upper-week', 'lower-week'], default: 'every-week' },
  schedule: {
    type: [lessonSchema],
    validate: [(value) => value.length > 0, 'Cədvəl boş ola bilməz.'],
  },
  teacher: { type: String, default: '' },
  room: { type: String, default: '' },
  sequenceOffset: { type: Number, default: 0 },
  overrides: { type: Object, default: {} },
}, { timestamps: true })

subjectSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = String(ret._id)
    delete ret._id
  },
})

export const Subject = mongoose.model('Subject', subjectSchema)
