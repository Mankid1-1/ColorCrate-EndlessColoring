# COMMERCIAL GUIDE: ColorCrate

This package contains the full source code for ColorCrate, an AI-powered coloring book generator, ready for commercial deployment.

## 1. Prerequisites

- **Node.js** (v18 or higher)
- **Docker** (for server deployment)
- **Android Studio** (for Android mobile build)
- **Xcode** (for iOS mobile build - requires macOS)
- **Google Gemini API Key** (Get one from [Google AI Studio](https://aistudiocdn.google.com/))

## 2. Configuration

Create a `.env` file in the `server/` directory (or pass as environment variables in Docker) with the following content:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

## 3. Web Deployment (Docker)

The easiest way to run the web application (Frontend + Backend) is using Docker.

1.  Navigate to the project root.
2.  Build the image:
    ```bash
    docker build -f deployment/Dockerfile -t colorcrate-app .
    ```
3.  Run the container:
    ```bash
    docker run -p 3000:3000 -e GEMINI_API_KEY=your_key_here colorcrate-app
    ```
4.  Access the app at `http://localhost:3000`.

## 4. Mobile Application Build

The mobile apps are built using **Capacitor**.

### Android

1.  Build the web assets:
    ```bash
    npm install
    npm run build
    ```
2.  Sync the assets to the Android project:
    ```bash
    npx cap sync android
    ```
3.  Open the project in Android Studio:
    ```bash
    npx cap open android
    ```
4.  In Android Studio, click the "Run" button to launch on a simulator or connected device.
5.  To build a release APK/Bundle, go to `Build > Generate Signed Bundle / APK`.

### iOS (Mac Only)

1.  Add the iOS platform (if not already added):
    ```bash
    npx cap add ios
    ```
2.  Sync assets:
    ```bash
    npm run build
    npx cap sync ios
    ```
3.  Open in Xcode:
    ```bash
    npx cap open ios
    ```
4.  Configure your Signing Team in Xcode settings and build.

## 5. Customization

- **Branding:** Replace logos in `public/` and `android/app/src/main/res/`.
- **Colors:** Edit `tailwind.config.js` in `index.html` (or separate config file if extracted).
- **Backend URL for Mobile:**
    - By default, the mobile app will try to hit the backend relative to where it's hosted.
    - Since the mobile app runs on `file://` or `http://localhost` (Capacitor server), you need to point it to your live backend.
    - Set `VITE_API_URL` in your build environment before running `npm run build`:
      ```bash
      export VITE_API_URL=https://your-deployed-server.com
      npm run build
      npx cap sync
      ```
