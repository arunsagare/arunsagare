# Meditation Journey App (Play Store Ready)

This repository now includes a **mobile app** you can prepare for Google Play Store deployment using Expo + React Native.

## Project structure

- `mobile-app/` → React Native app (Expo) for Android/iOS.
- Existing web prototype files (`index.html`, `script.js`, `style.css`) are still available as a browser version.

## Mobile features

- Meditation session tracking (date, minutes, technique, focus score).
- Self-awareness journal tracking (thought, intensity, mindful response).
- Goal focus check-ins and completion tracking.
- Progress snapshot (sessions, total minutes, streak, average focus, completion rate).
- Coach tips based on your logs.
- Deep focus timer.
- Reflection prompt generator + milestone badges.
- Backup/restore JSON (copy-paste based).
- Local persistence via AsyncStorage.

## Run mobile app locally

1. Install dependencies:
   ```bash
   cd mobile-app
   npm install
   ```
2. Start development server:
   ```bash
   npm run start
   ```
3. Run Android:
   ```bash
   npm run android
   ```

## Prepare for Play Store

1. Update package id in `mobile-app/app.json` (`android.package`) to your unique domain format.
2. Build Android release with EAS:
   ```bash
   npm install -g eas-cli
   cd mobile-app
   eas build -p android
   ```
3. Upload generated `.aab` file to Google Play Console.
4. Fill listing details (privacy policy, screenshots, app description, age rating).
5. Submit for review.

## Notes

- All data is stored on-device.
- For production launch, add app icon/splash assets and privacy policy URL.
