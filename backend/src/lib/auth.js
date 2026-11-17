import jwt from 'jsonwebtoken'

const getSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET təyin edilməyib (backend/.env faylına bax).')
  }
  return secret
}

export const signToken = (userId) => jwt.sign(
  { sub: String(userId) },
  getSecret(),
  { expiresIn: '30d' },
)

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Giriş tələb olunur.' })
  }
  try {
    const payload = jwt.verify(token, getSecret())
    req.userId = payload.sub
    return next()
  } catch {
    return res.status(401).json({ error: 'Sessiya bitib, yenidən daxil ol.' })
  }
}
