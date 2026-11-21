import mongoose from 'mongoose'

const semesterSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  name: { type: String, required: true, trim: true },
  subjects: { type: [mongoose.Schema.Types.Mixed], default: [] },
  weekState: { type: mongoose.Schema.Types.Mixed, default: null },
  archivedAt: { type: Date, default: Date.now },
}, { timestamps: true })

export const Semester = mongoose.model('Semester', semesterSchema)
