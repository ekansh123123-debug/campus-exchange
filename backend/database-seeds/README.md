# MongoDB Collection Upload / Import Files

This directory contains clean, standalone JSON data files structured for the **CampusExchange** MongoDB database (`campus_exchange`).

You can upload these files into your MongoDB Atlas cluster or MongoDB Compass.

---

## 1. Files & Corresponding Collections

| File | MongoDB Collection | Description |
|---|---|---|
| `categories.json` | `categories` | The 6 essential academic categories (Textbooks, Calculators, Drawing Instruments, Lab Kits, Notes, Supplies). |
| `users.json` | `users` | Admin account (`admin@nitk.edu.in`) and two verified student accounts with pre-hashed bcrypt passwords. |
| `listings.json` | `listings` | Clean campus listings (Algorithms book, Scientific calculator, Drawing drafter kit). |
| `resources.json` | `resources` | Moderated study resources (Data Structures PYQ pack, Microprocessor lab manual). |

---

## 2. Test Account Credentials

Once you import `users.json`, you can log in immediately with:

- **Campus Admin**:
  - Email: `admin@nitk.edu.in`
  - Password: `AdminPassword@123`
- **Student User 1**:
  - Email: `aarav.cs24@nitk.edu.in`
  - Password: `StudentPassword@123`
- **Student User 2**:
  - Email: `priya.ec25@nitk.edu.in`
  - Password: `StudentPassword@123`

---

## 3. How to Upload to MongoDB

### Option A: One-Click Script (Recommended)
You can directly sync all files to your MongoDB Atlas cluster by running:
```bash
cd backend
npm run db:import
```
This reads your `MONGODB_URI` from `backend/.env` and upserts all 4 collections automatically.

---

### Option B: MongoDB Atlas Web UI
1. Log into your [MongoDB Atlas](https://cloud.mongodb.com/) dashboard.
2. Under **Database**, click **Browse Collections**.
3. Select your database (e.g., `campus_exchange`).
4. For each collection (`categories`, `users`, `listings`, `resources`):
   - Click the collection name (or click **Create Collection** if not yet created).
   - Click the **Insert Document** button.
   - Switch to JSON mode (`{}`).
   - Copy the array from the corresponding `.json` file and paste it into the editor.
   - Click **Insert**.

---

### Option C: MongoDB Compass (Desktop GUI)
1. Open MongoDB Compass and connect using your connection string:
   `mongodb+srv://...`
2. Open the `campus_exchange` database.
3. Select or create each collection (`categories`, `users`, `listings`, `resources`).
4. Click **Add Data** -> **Import JSON or CSV file**.
5. Select the corresponding `.json` file from this folder (`database-seeds/`).
6. Click **Import**.
