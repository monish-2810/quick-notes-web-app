# 📝 Quick Notes Web App (Per-User Login + Persistent Storage)

A full-stack **Note Taking Web Application** built using **HTML, CSS, JavaScript, Node.js, and Express.js** — now upgraded with **per-user login and private notes**.  
Each registered user can securely **create, edit, pin, and manage their own notes**, stored permanently in local JSON files.

---

## 🚀 Features

| Category | Feature Description |
|-----------|----------------------|
| 🔐 **Authentication** | Secure user **Register**, **Login**, and **Logout** using `express-session` |
| 👤 **Per-User Notes** | Each user sees only their own notes — private & isolated |
| 🧾 **Notes Management** | Add, Edit, Delete, and Search your notes easily |
| 📌 **Pin Notes** | Highlight important notes to appear at the top |
| 💾 **Persistent Storage** | Notes & users saved in JSON files (no database required) |
| 🔑 **Secure Passwords** | Passwords hashed with **bcryptjs** |
| 🎨 **Modern UI** | Clean design, responsive layout, sticky header |
| 🔍 **Search Function** | Real-time note filtering |
| ⚡ **Session Handling** | Users stay logged in until logout or session expiry |

---

## 🧠 Project Overview

The **Quick Notes Web App** is a simple yet powerful example of a **full-stack JavaScript** project.  
It integrates authentication, file-based persistence, and clean frontend interactions — perfect for understanding how modern web apps function end-to-end.

Built using:
- **Frontend:** HTML, CSS, JavaScript (Fetch API)
- **Backend:** Node.js + Express.js
- **Storage:** JSON files (`notes.json`, `users.json`)
- **Auth:** Sessions + bcrypt password hashing

---

## 🗂️ Project Structure

quick-notes/
│
├── public/
│ ├── index.html # Main notes UI
│ ├── login.html # User login page
│ ├── register.html # New user registration page
│ ├── app.js # Frontend logic (auth + CRUD + UI)
│ └── styles.css # Styling (shared by all pages)
│
├── server.js # Backend logic (Express + Auth + CRUD)
├── package.json # Node.js dependencies
├── notes.json # Persistent note storage
├── users.json # Persistent user storage
└── README.md # Project documentation

yaml
Copy code

---

## ⚙️ Installation & Setup

### 🧩 Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)
- Browser (Chrome, Edge, Firefox)

---

### 🔹 Step 1: Clone Repository
```bash
git clone https://github.com/monish-2810/quick-notes-web-app.git
cd quick-notes-web-app
🔹 Step 2: Install Dependencies
bash
Copy code
npm install
🔹 Step 3: Start the Server
bash
Copy code
npm start
🔹 Step 4: Open in Browser
Visit 👉 http://localhost:3000

🔐 Authentication Flow
🆕 Register:
Go to /register.html and create a new account.
You’ll be automatically logged in after successful registration.

🔑 Login:
Go to /login.html and log in with your credentials.

✍️ Create Notes:
Once logged in, you can add, edit, delete, pin, or search your notes.

🚪 Logout:
Click Logout in the header to end your session.

🧩 Modules
Module	Description
Auth Module	Handles user registration, login, logout, and session management
Notes Module	Manages per-user notes (Add, Edit, Delete, Search, Pin)
Persistence Module	Stores user and note data in JSON files
Frontend Module	Manages UI rendering and API interaction using Fetch

🖼️ Sample Screenshots (Add Yours Here)
📷 Save these screenshots after running your app locally.

🏠 Home (Notes)

Displays all your notes with options to pin, edit, or delete.

🔐 Login Page

Simple login form for existing users.

🆕 Register Page

Allows creation of a new account.

📌 Pinned Notes

Important notes appear at the top.

✏️ Edit Note

Inline editing with live updates.

✅ Advantages
Simple, lightweight, and beginner-friendly

Secure per-user note handling

No database setup required

Easy to deploy and run locally

Fully responsive UI with consistent theme

⚠️ Limitations
Data stored locally (JSON file) — not shared across servers

No password reset or email verification

Sessions reset on server restart

Not suitable for production-scale apps

🔮 Future Enhancements
🌐 Move from JSON to MongoDB or MySQL

📱 Add mobile app support using React or Flutter

👥 Add profile management (edit name, change password)

☁️ Deploy app to cloud (Render, Vercel, Railway)

🌙 Implement Dark Mode

🧩 Add note categories or color labels

🧑‍💻 Developed By
Name: Monish B
Project Title: Quick Notes Web App (Per-User Login + Persistent Storage)
Tools Used: Node.js, Express.js, HTML, CSS, JavaScript
IDE: Visual Studio Code
College: Sathyabma Institute of Science and Technology


📎 Links
💻 GitHub Repository:
https://github.com/monish-2810/quick-notes-web-app

📊 Project Presentation (PPT):
Download Quick_Notes_Presentation.pptx

🏁 Conclusion
The Quick Notes Web App demonstrates key full-stack concepts, combining:

Secure Authentication

Per-user note storage

RESTful API design

Persistent local storage

It’s an ideal project for showcasing web development fundamentals — from front-end interactivity to back-end logic and data handling.