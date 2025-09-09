# Geofence Project

This repository contains two parts:
- `api` — Backend (Node.js + Express + MongoDB)
- `geofence` — Frontend (React Native app)

This README explains how to run both locally.

----

## Prerequisites
- Node.js (14+)
- npm or yarn
- MongoDB running locally or MongoDB Atlas
- For mobile app: React Native environment (Android Studio for Android, Xcode for iOS)
  - Android: set ANDROID_HOME and install SDKs
  - iOS: CocoaPods installed (macOS)

Optional:
- ngrok (for exposing sockets/webhooks during development)

----

## Backend (api)

1. Open terminal and go to the api folder:

   cd e:\_Github Projects\geofence_project\api

2. Install dependencies:

   npm install
   
   or

   yarn install

3. Create a `.env` file in the `api` folder with these variables (example):

   MONGO_URI=mongodb://localhost:27017/geofence
   JWT_SECRET=your_jwt_secret
   PORT=5000

4. Start the server:

   npm run dev
   
   or

   node server.js

5. Verify the server is running on the port (default 5000). API endpoints used by the app include (examples):
   - POST /auth/register
   - POST /auth/login
   - POST /circles/:id/generate-invite
   - GET /circles/:id
   - GET /users/circle-members (project-specific)
   - Socket server (if enabled) — see services/socket.js or sockets/ folder

Notes:
- If you have a unique index conflict (duplicate key) after changing models, restart MongoDB and the server so Mongoose can apply any index changes.
- Use logs printed to console for errors when registering/creating circles.

----

## Frontend (React Native app)

1. Open a new terminal and go to the geofence app folder:

   cd e:\_Github Projects\geofence_project\geofence

2. Install dependencies:

   npm install
   
   or

   yarn install

3. Update API base URL if needed. The client uses `src/api/index.js` to set the base URL — make sure it points to your backend (e.g., http://10.0.2.2:5000 for Android emulator, or http://localhost:5000 for iOS simulator).

4. Start Metro bundler:

   npx react-native start

5. Run the app:

   Android:
   npx react-native run-android

   iOS (macOS):
   npx react-native run-ios

Notes:
- For Android emulator use `10.0.2.2` to access localhost server running on your machine. For a real device use your machine IP or ngrok.
- If you use ngrok for sockets, update SOCKET_URL in the app to the ngrok URL.
- If the app shows map or native module errors, confirm the map library you installed (MapLibre / Mapbox / react-native-maps) and matching native installation steps.

----

## Typical workflow
1. Start MongoDB
2. Start backend server (`api`)
3. Start Metro and run the React Native app (`geofence`)
4. Register a user as Admin in the app; when registering as admin, provide a Circle Name — the backend will create a circle and return user's circle id.
5. In the app (Add Person) the admin can generate an invite code and share it with members. Members register using that code to join the same circle.

----

## Troubleshooting
- Continuous loading on screens: ensure backend routes used by the screen exist and return expected data. Check console logs in Metro and backend server.
- Duplicate key error for invite code being null: the backend model uses a sparse unique index for invite.code so null values are allowed. If you still see duplicate key errors, restart the server and MongoDB to ensure index changes are in effect.
- mapRef.setCamera is undefined: different map libraries expose different APIs. If you get this error, verify which map package is installed and adjust imports/calls accordingly.
- Socket connection problems: verify SOCKET_URL in frontend matches the server URL; use ngrok if testing across devices.

----

## Useful commands
- Install deps: `npm install` or `yarn`
- Start backend (dev): `npm run dev`
- Start backend (prod): `node server.js`
- Start Metro: `npx react-native start`
- Run Android: `npx react-native run-android`
- Run iOS: `npx react-native run-ios`

----

BFD55F