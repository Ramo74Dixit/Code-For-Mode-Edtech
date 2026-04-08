# 🎓 Code For Mode — EdTech Platform
## Complete Project Structure & Architecture

---

## 📁 Directory Tree

```
codeformodeedtech/
│
├── 📂 backend/                          ← Express.js REST API + Socket.IO
│   ├── 📄 server.js                     ← Entry point, Socket.IO, routes mount
│   ├── 📄 .env                          ← Secrets (JWT, DB, Razorpay, Cloudinary)
│   │
│   ├── 📂 config/
│   │   └── 📄 db.js                     ← MongoDB connection
│   │
│   ├── 📂 middleware/
│   │   └── 📄 auth.js                   ← JWT protect + role authorize
│   │
│   ├── 📂 models/                       ← Mongoose Schemas (14 models)
│   │   ├── 📄 User.js                   ← student | trainer | admin
│   │   ├── 📄 Course.js                 ← Videos[], price, category
│   │   ├── 📄 Batch.js                  ← classSchedule[], enrolled[], videos[]
│   │   ├── 📄 BatchEnrollment.js        ← Progress, attendance, payment tracking
│   │   ├── 📄 Enrollment.js             ← Course-level enrollment record
│   │   ├── 📄 LiveSession.js            ← YouTube stream, attendees[], schedule
│   │   ├── 📄 Test.js                   ← questions[{testCases[]}]
│   │   ├── 📄 TestSubmission.js         ← Score, sectionSubmissions[]
│   │   ├── 📄 Assignment.js             ← Batch assignments
│   │   ├── 📄 AssignmentSubmission.js   ← Student submissions
│   │   ├── 📄 Announcement.js           ← Batch announcements
│   │   ├── 📄 Payment.js                ← Razorpay payment records
│   │   ├── 📄 Message.js                ← Real-time chat (room, sender, content)
│   │   └── 📄 Progress.js               ← Video progress tracking
│   │
│   ├── 📂 controllers/                  ← Business Logic (14 controllers)
│   │   ├── 📄 authController.js         ← register, login, google, me, updateDetails
│   │   ├── 📄 batchController.js        ← CRUD + enroll + stats + student details
│   │   ├── 📄 courseController.js       ← CRUD courses
│   │   ├── 📄 liveStreamController.js   ← schedule/start/end/attend sessions
│   │   ├── 📄 testController.js         ← CRUD + runCode(Judge0) + submitTest
│   │   ├── 📄 enrollmentController.js   ← enroll, progress, my enrollments
│   │   ├── 📄 paymentController.js      ← Razorpay order + verify + auto-enroll
│   │   ├── 📄 assignmentController.js   ← CRUD assignments + submissions
│   │   ├── 📄 announcementController.js ← Batch announcements CRUD
│   │   ├── 📄 aiController.js           ← Gemini AI Interview Coach
│   │   ├── 📄 uploadController.js       ← Cloudinary file upload
│   │   ├── 📄 adminController.js        ← Admin panel endpoints
│   │   ├── 📄 chatController.js         ← Fetch chat history
│   │   └── 📄 liveSessionController.js  ← (alias of liveStreamController)
│   │
│   ├── 📂 routes/                       ← Express Routers (15 files)
│   │   ├── 📄 auth.js                   ← /api/auth/*
│   │   ├── 📄 courses.js                ← /api/courses/*
│   │   ├── 📄 batches.js                ← /api/batches/*
│   │   ├── 📄 LiveStream.js             ← /api/live-sessions/*
│   │   ├── 📄 tests.js                  ← /api/tests/*
│   │   ├── 📄 enrollments.js            ← /api/enrollments/*
│   │   ├── 📄 payment.js                ← /api/payment/*
│   │   ├── 📄 assignments.js            ← /api/assignments/*
│   │   ├── 📄 announcements.js          ← /api/announcements/*
│   │   ├── 📄 aiRoutes.js               ← /api/ai/*
│   │   ├── 📄 uploadRoutes.js           ← /api/upload/*
│   │   ├── 📄 admin.js                  ← /api/admin/*
│   │   ├── 📄 chat.js                   ← /api/chat/*
│   │   ├── 📄 learningRoutes.js         ← /api/* (misc)
│   │   └── 📄 paymentRoutes.js          ← (alias)
│   │
│   └── 📂 services/
│       └── 📄 aiService.js              ← Gemini API wrapper
│
├── 📂 frontend/                         ← React 19 + Vite + Tailwind CSS
│   ├── 📄 index.html
│   ├── 📄 vite.config.js
│   ├── 📄 tailwind.config.js
│   │
│   └── 📂 src/
│       ├── 📄 main.jsx                  ← ReactDOM root
│       ├── 📄 App.jsx                   ← Routes + ProtectedRoute + GoogleOAuth
│       ├── 📄 index.css                 ← Global Tailwind styles
│       │
│       ├── 📂 context/
│       │   └── 📄 AuthContext.jsx       ← user, login, logout, isTrainer, isAdmin
│       │
│       ├── 📂 services/
│       │   └── 📄 api.js                ← Axios instance (base URL + auth header)
│       │
│       ├── 📂 components/
│       │   ├── 📂 auth/                 ← Login/Register forms
│       │   ├── 📂 layout/
│       │   │   └── 📄 MainLayout.jsx    ← Sidebar + Navbar wrapper
│       │   ├── 📂 dashboard/
│       │   │   └── 📂 trainer/          ← Trainer-specific modals
│       │   │       ├── 📄 CreateTestModal.jsx
│       │   │       ├── 📄 EditTestModal.jsx
│       │   │       ├── 📄 ScheduleLiveModal.jsx
│       │   │       └── 📄 StudentDetailModal.jsx
│       │   ├── 📂 chat/                 ← Socket.IO chat UI
│       │   ├── 📂 ide/                  ← Monaco Editor wrapper
│       │   └── 📂 ui/                   ← Reusable UI components
│       │
│       └── 📂 pages/
│           ├── 📂 auth/                 ← LoginPage, RegisterPage
│           ├── 📂 dashboard/
│           │   ├── 📄 index.jsx         ← Role-based redirect
│           │   ├── 📄 StudentDashboard.jsx
│           │   └── 📄 TrainerDashboard.jsx
│           ├── 📂 courses/              ← CourseList, CreateCourse, CourseDetails
│           ├── 📂 batches/              ← BatchList, CreateBatch, BatchDetails, BatchLearningHub
│           ├── 📂 tests/                ← TestArena (coding + submission)
│           ├── 📂 assignments/          ← AssignmentList
│           ├── 📂 live-classes/         ← LiveSchedule
│           ├── 📂 community/            ← Community (real-time chat)
│           ├── 📂 announcements/        ← AnnouncementList
│           ├── 📂 materials/            ← MaterialList
│           ├── 📂 ai/                   ← InterviewCoach (Gemini AI)
│           ├── 📂 profile/              ← Profile, TrainerProfile
│           └── 📂 admin/                ← AdminDashboard
│
└── 📂 mobile/                           ← Expo React Native App
    ├── 📄 App.js
    ├── 📄 index.js
    └── 📂 src/
        ├── 📂 screens/                  ← Mobile screens
        ├── 📂 components/               ← Mobile components
        ├── 📂 navigation/               ← React Navigation setup
        ├── 📂 context/                  ← Mobile auth context
        ├── 📂 config/                   ← API config
        └── 📂 constants/                ← App constants
```

---

## 🔄 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                  │
│                                                                 │
│   ┌──────────────────┐    ┌──────────────────────────────┐     │
│   │  🌐 WEB FRONTEND  │    │  📱 MOBILE APP (Expo)         │     │
│   │  React 19 + Vite │    │  React Native                │     │
│   │  Tailwind CSS    │    │                              │     │
│   │  React Router v7 │    │                              │     │
│   │  Monaco Editor   │    │                              │     │
│   │  Socket.IO Client│    │                              │     │
│   └────────┬─────────┘    └──────────────┬───────────────┘     │
└────────────┼──────────────────────────────┼────────────────────┘
             │                              │
             │   HTTP REST + WebSocket      │   HTTP REST
             ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVER                              │
│                  Node.js + Express 5                            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │  REST API   │  │  Socket.IO  │  │    Auth Middleware    │   │
│  │  (15 routes)│  │  (Chat)     │  │  JWT + Role-based    │   │
│  └──────┬──────┘  └──────┬──────┘  └──────────────────────┘   │
│         │                │                                      │
│  ┌──────▼────────────────▼──────────────────────────────────┐  │
│  │                  CONTROLLERS (14)                         │  │
│  │  auth │ batch │ course │ liveStream │ test │ payment ...  │  │
│  └──────────────────────────┬──────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │                   MODELS (14)                            │  │
│  │  User │ Course │ Batch │ BatchEnrollment │ LiveSession   │  │
│  │  Test │ TestSubmission │ Assignment │ Message │ Payment  │  │
│  └──────────────────────────┬──────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  🍃 MongoDB  │  │  ☁️ Cloudinary│  │  🤖 Judge0  │
    │  Atlas/Local │  │  (Uploads)   │  │  (Code Exec) │
    └──────────────┘  └──────────────┘  └──────────────┘
              ▲               ▲
    ┌─────────┴──────┐ ┌──────┴──────────┐
    │  💳 Razorpay   │ │  🔑 Google OAuth │
    │  (Payments)    │ │  (Login)         │
    └────────────────┘ └─────────────────┘
```

---

## 🗄️ Database Schema & Relationships

```
User (student/trainer/admin)
 │
 ├──[creates]──────────────► Course
 │                              │
 ├──[creates]──────────────► Batch ──────────────────────┐
 │                              │                         │
 │                              ├──[has many]──► LiveSession
 │                              ├──[has many]──► Assignment
 │                              ├──[has many]──► Test ────────► TestSubmission
 │                              ├──[has many]──► Announcement
 │                              └──[has many]──► Videos[]
 │
 ├──[enrolls via]──────────► BatchEnrollment ──────────────┘
 │                              │ (student x batch x course)
 │                              └── progress, attendance, payment
 │
 ├──[pays via]─────────────► Payment (Razorpay)
 │
 ├──[chats via]────────────► Message (room-based)
 │
 └──[submits]──────────────► AssignmentSubmission
```

---

## 🔐 Authentication Flow

```
User Opens App
      │
      ▼
  ┌───────────┐     ┌─────────────────┐
  │   Login   │────►│  Email/Password  │──►  JWT Token (30 days)
  │   Page    │     └─────────────────┘         │
  │           │     ┌─────────────────┐          │
  │           │────►│  Google OAuth   │──────────┤
  └───────────┘     └─────────────────┘          │
                                                  ▼
                                       localStorage (token + user)
                                                  │
                                                  ▼
                                       AuthContext (React)
                                         user, isTrainer, isAdmin
                                                  │
                                    ┌─────────────┼─────────────┐
                                    ▼             ▼             ▼
                              StudentDashboard  TrainerDashboard  AdminDashboard
```

---

## 🧪 Coding Test Flow

```
Trainer Creates Test
  (questions + testCases[] per question)
           │
           ▼
     Test saved in DB
           │
           ▼
    Student Opens TestArena
    (Monaco Code Editor)
           │
    ┌──────┴──────┐
    │   Run Code  │──► POST /api/tests/run-code
    │  (practice) │         │
    └─────────────┘         ▼
                       Judge0 CE API
                       (executes code)
                            │
                            ▼
                      Output returned
           │
    ┌──────┴──────┐
    │  Submit Test│──► POST /api/tests/submit-evaluated
    │             │         │
    └─────────────┘         ▼
                       TestSubmission saved
                       (totalScore computed)
```

---

## 💳 Payment Flow

```
Student clicks "Enroll" on Paid Batch
              │
              ▼
    POST /api/payment/create-order
    (batchPrice > 0 ? batchPrice : coursePrice)
              │
              ▼
       Razorpay Order Created
              │
              ▼
    Razorpay Payment Modal (Frontend)
    Student pays via UPI/Card/Net Banking
              │
              ▼
    POST /api/payment/verify-payment
    (HMAC SHA256 signature verified)
              │
        ┌─────┴─────┐
        │  ✅ Valid  │
        └─────┬─────┘
              │
              ▼
    Payment record saved in DB
    BatchEnrollment created (status: 'paid')
    Student added to batch.enrolledStudents[]
              │
              ▼
    Redirect to BatchLearningHub
```

---

## 💬 Real-Time Chat Flow (Socket.IO)

```
Student/Trainer opens Community page
              │
              ▼
    socket.emit('join_room', roomId)
              │
              ▼
    Server: socket.join(roomId)
              │
              ▼
    User sends message
    socket.emit('send_message', { room, senderId, message })
              │
              ▼
    Server saves to MongoDB (Message model)
    Populates sender name + profileImage
              │
              ▼
    socket.to(room).emit('receive_message', populatedMessage)
              │
              ▼
    All users in room receive message in real-time
```

---

## 🌐 API Endpoints Summary

```
AUTH
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/google
  GET    /api/auth/me
  PUT    /api/auth/updatedetails
  GET    /api/auth/:id/profile

COURSES
  GET    /api/courses              (public list)
  POST   /api/courses              (trainer only)
  GET    /api/courses/:id
  PUT    /api/courses/:id          (trainer only)
  DELETE /api/courses/:id          (trainer only)

BATCHES
  GET    /api/batches              (public)
  POST   /api/batches              (trainer)
  GET    /api/batches/my/enrollments      (student)
  GET    /api/batches/trainer/my-batches  (trainer)
  GET    /api/batches/trainer/dashboard-stats (trainer)
  GET    /api/batches/:id
  PUT    /api/batches/:id          (trainer)
  DELETE /api/batches/:id          (trainer)
  POST   /api/batches/:id/enroll   (student)
  POST   /api/batches/:id/videos   (trainer)
  DELETE /api/batches/:id/videos/:videoId (trainer)
  POST   /api/batches/:id/resources (trainer)
  GET    /api/batches/:id/students  (trainer)
  GET    /api/batches/:id/students/:studentId/details (trainer)

LIVE SESSIONS
  POST   /api/live-sessions              (trainer - schedule)
  GET    /api/live-sessions/batch/:batchId
  GET    /api/live-sessions/my/upcoming  (student)
  GET    /api/live-sessions/my/all       (student)
  GET    /api/live-sessions/:id
  PUT    /api/live-sessions/:id          (trainer - update)
  PUT    /api/live-sessions/:id/start    (trainer)
  PUT    /api/live-sessions/:id/end      (trainer)
  POST   /api/live-sessions/:id/attendance (student)
  DELETE /api/live-sessions/:id          (trainer)

TESTS
  POST   /api/tests                 (trainer - create)
  PUT    /api/tests/:id             (trainer - update)
  GET    /api/tests/batch/:batchId
  GET    /api/tests/:id
  GET    /api/tests/:id/submissions  (trainer)
  POST   /api/tests/run-code         (student - Judge0)
  POST   /api/tests/submit           (student - server eval)
  POST   /api/tests/submit-evaluated (student - client eval)

PAYMENT
  POST   /api/payment/create-order
  POST   /api/payment/verify-payment

ENROLLMENTS
  POST   /api/enrollments/:courseId
  GET    /api/enrollments
  PUT    /api/enrollments/:courseId/progress

AI
  POST   /api/ai/*                  (Gemini AI Interview Coach)

UPLOAD
  POST   /api/upload/*              (Cloudinary)

ADMIN
  GET    /api/admin/*
```

---

## 📱 Frontend Route Map

```
/                    → DashboardRedirect (role-based)
  ├── /login         → LoginPage
  ├── /register      → RegisterPage
  ├── /courses       → CourseList
  ├── /courses/create → CreateCourse (trainer)
  ├── /courses/:id   → CourseDetails
  ├── /batches       → BatchList
  ├── /batches/create → CreateBatch (trainer)
  ├── /batches/:id   → BatchDetails
  ├── /batches/:id/learn → BatchLearningHub
  ├── /assignments   → AssignmentList
  ├── /materials     → MaterialList
  ├── /live-classes  → LiveSchedule
  ├── /community     → Community (Socket.IO chat)
  ├── /announcements → AnnouncementList
  ├── /interview     → AI InterviewCoach
  ├── /profile       → Profile
  ├── /trainer/:id   → TrainerProfile (public)
  └── /admin         → AdminDashboard

/tests/:id/start     → TestArena (outside MainLayout)
```

---

> 📝 **Last Updated:** April 2026
> 🔧 **Stack:** MERN + Expo + Socket.IO + Razorpay + Judge0 + Gemini AI
