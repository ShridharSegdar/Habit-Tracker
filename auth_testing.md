# Auth Testing Playbook — CAT Habit Tracker

## Admin / test accounts
- Admin: `admin@cattracker.app` / `Admin@2026`
- User : `aspirant@cattracker.app` / `Aspirant@2026`
- Demo Google session: token `demo_session_shridhar_2026`, user_id `user_demoshridhar`

## Step 1: MongoDB Verification
```bash
mongosh test_database --quiet --eval "
  db.users.find({email:/cattracker/}, {password_hash:1, email:1, name:1, role:1}).pretty();
  db.user_sessions.find({}, {session_token:1, user_id:1, expires_at:1}).pretty();
"
```
Verify:
- Admin user exists with bcrypt hash starting `$2b$`
- Indexes: `users.email` unique, `user_sessions.session_token` unique

## Step 2: API smoke
```bash
BACK=$REACT_APP_BACKEND_URL
# Register
curl -X POST $BACK/api/auth/register -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","password":"Test1234","name":"New User"}'
# Login
curl -c /tmp/c.txt -X POST $BACK/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@cattracker.app","password":"Admin@2026"}'
# Me (with cookie)
curl -b /tmp/c.txt $BACK/api/auth/me
# Habits
curl -b /tmp/c.txt $BACK/api/habits
```

## Step 3: Browser
```javascript
await page.context.add_cookies([{
  "name":"session_token", "value":"demo_session_shridhar_2026",
  "domain":"<host>", "path":"/", "httpOnly":true, "secure":true, "sameSite":"None"
}]);
await page.goto("<base_url>/dashboard");
```
