import mongoose from 'mongoose'

// Göndərilmiş push-ların iddiaları — təkrar göndərmənin qarşısını alır.
// Unikal açar restart/yeni instans hallarında da dublikatı bloklayır.
// Köhnə qeydləri Mongo özü silir (DB şişmir).
const pushLogSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 3 * 86400 },
})

export const PushLog = mongoose.model('PushLog', pushLogSchema)
