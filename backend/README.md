# AcademicSchedule backend

Express + MongoDB (Mongoose). Fənnlər və həftə rejimi burada saxlanılır.

## Başlatma

```bash
cd backend
cp .env.example .env   # Windows: copy .env.example .env
# .env içində MONGODB_URI yaz (öz Mongo instansının ünvanı)
npm install
npm run dev            # və ya: npm start
```

API: `http://localhost:5000/api/health`

## Endpointlər

- `POST /api/auth/register` — `{ name, email, password }` → `{ token, user }`
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- `POST /api/auth/forgot-password` — `{ email }` → bərpa linki e-poçta gedir (SMTP lazımdır)
- `POST /api/auth/reset-password` — `{ token, password }` → şifrə yenilənir
- `PUT /api/auth/password` — `{ currentPassword, newPassword }` (JWT lazımdır)
- `DELETE /api/auth/me` — `{ password }` → hesab + bütün məlumatlar silinir (JWT lazımdır)
- `GET/POST /api/subjects`, `PUT/DELETE /api/subjects/:id` (JWT lazımdır)
- `GET/PUT /api/week-state` (JWT lazımdır)
- `POST /api/templates` — `{ name?, subjects }` → `{ code, name }` (JWT lazımdır)
- `GET /api/templates/:code` — şablonu kodla yükləyir (JWT lazımdır)

Qorunan sorğular `Authorization: Bearer <token>` başlığı istəyir.

## Qeydlər

- `MONGODB_DB_NAME` (default `academic-schedule`) bu layihənin ayrıca
  verilənlər bazasıdır — eyni Mongo instansındakı digər layihələrdən təcrid edir.
- `JWT_SECRET` mütləqdir — uzun təsadüfi sətir qoy (nümunə `.env.example`-də).
- Hər istifadəçi yalnız öz fənnlərini və həftə rejimini görür.
- Frontend `VITE_API_URL` ilə bu API-yə bağlanır (bax: `frontend/.env.example`).
- İlk açılışda brauzerdəki köhnə localStorage məlumatı avtomatik köçürülür.
