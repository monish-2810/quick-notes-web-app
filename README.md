# 📝 Quick Notes Web App

A lightweight and user-friendly web application for taking, editing, pinning, and searching notes — built with **HTML, CSS, JavaScript, Node.js, and Express.js**.
Unlike simple memory-based apps, this version saves notes **persistently** using a local **JSON file**, so your notes stay even after restarting the server.

---

## 🚀 Features

- ✍️ **Add Notes** – Quickly write and save short notes.
- 🧾 **Edit / Delete Notes** – Update or remove notes easily.
- 📌 **Pin Notes** – Keep important notes at the top.
- 🔍 **Search Notes** – Instantly filter notes by keywords.
- 💾 **Persistent Storage** – Notes are saved in a JSON file (no database needed).
- ⚡ **Smooth UI** – Modern interface with animations.

---

## 🧠 Project Abstract

The **Quick Notes Web App** allows users to efficiently manage small notes directly from their browser.
It demonstrates a full-stack JavaScript implementation using **Express.js** for the backend and **vanilla JS** for frontend logic.
The data is stored in a `notes.json` file, ensuring persistence without needing a complex database.

---

## 🏗️ Project Structure

quick-notes-web-app/
│
├── public/
│ ├── index.html # Frontend UI
│ ├── styles.css # Styling
│ └── app.js # Frontend logic
│
├── server.js # Node.js + Express backend
├── notes.json # JSON data file (auto-created)
├── package.json # Dependencies and scripts
└── README.md # Project documentation

---

## ⚙️ Installation and Setup

### 🔹 Prerequisites
Make sure you have installed:
- [Node.js](https://nodejs.org/) (v18 or later)
- [Git](https://git-scm.com/)
- Any modern browser (Chrome, Edge, Firefox)

### 🔹 Steps to run

```bash
# Clone the repository
git clone https://github.com/monish-2810/quick-notes-web-app.git

# Navigate to project folder
cd quick-notes-web-app

# Install dependencies
npm install

# Start the server
npm start
