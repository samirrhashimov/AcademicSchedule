import mongoose from 'mongoose'

export const connectDb = async () => {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI təyin edilməyib (backend/.env faylına bax).')
  }
  const dbName = process.env.MONGODB_DB_NAME || 'academic-schedule'
  await mongoose.connect(uri, { dbName })
  try {
    // Köhnə tək-unikal açarı sil (çox istifadəçiyə mane olurdu).
    await mongoose.connection.db.collection('weekstates').dropIndex('key_1')
  } catch {
    // indeks yoxdursa problem deyil
  }
  return dbName
}
