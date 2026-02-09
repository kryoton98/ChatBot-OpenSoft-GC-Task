# 🤖 AI Chatbot 

A full-stack AI chatbot application built with the MERN stack (MongoDB, Express, React, Node.js). It features secure Google Authentication, real-time chat storage, and a modern UI.

## 🚀 Features

- **Google Authentication:** Secure login/signup using Google OAuth 2.0.
- **JWT Authorization:** Dual-token system (Access + Refresh Tokens) for session management.
- **AI Integration:** Connects to Gemini/OpenAI API for intelligent responses.
- **Chat History:** Saves all conversations to MongoDB for easy retrieval.
- **Responsive UI:** Modern, dark-themed interface built with React + Vite.

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- TailwindCSS
- Axios
- React Router DOM

**Backend:**
- Node.js & Express.js
- MongoDB (Mongoose)
- Google Auth Library
- JSON Web Token (JWT)

## ⚙️ Environment Variables

To run this project, you will need to add the following environment variables to your .env file in the `backend` folder:

`PORT` = 5000
`MONGO_URI` = your_mongodb_connection_string
`JWT_SECRET` = your_random_secret_string
`JWT_REFRESH_SECRET` = your_random_refresh_secret
`GOOGLE_CLIENT_ID` = your_google_console_client_id

[![Watch the Demo](https://img.youtube.com/vi/dvahTG6WgMY/0.jpg)](https://www.youtube.com/watch?v=dvahTG6WgMY)

