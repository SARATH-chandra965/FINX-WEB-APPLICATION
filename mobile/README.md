# FINX

FINX is an Expo application for explainable, rule-based review of suspicious messages, URLs, and call transcripts. Scans and safety guidance work without an account. Submitted content is analyzed only after the user asks for a scan. By default, history stores scan metadata locally, not submitted message content.

## Run locally

```sh
npm install
npx expo start
npx expo start --web
```

Web export and validation:

```sh
npx expo export --platform web
npx expo-doctor
npm run typecheck
npm test
```

## Firebase email authentication (optional)

Create a Firebase project, register a Web app, enable **Email/Password** in Authentication, and copy the web app configuration to the `EXPO_PUBLIC_FIREBASE_*` entries in `.env` (start from `.env.example`). These values identify a Firebase client app and are public; never use a Firebase Admin/service-account key in the app. The app uses Firebase Auth's email/password account creation, sign-in, password reset, auth-state observer, and sign-out. Native sessions use AsyncStorage persistence; web uses the Firebase web persistence default. Auth remains optional and does not gate local scans or safety guidance.

Firebase Console authorized domains must include the deployed web host. The project must also have email/password sign-in enabled for these actions to succeed. Without configuration, the account screen explains that setup is missing.

## Optional hosted analysis API

The app runs local rules when no analysis endpoint is configured. To submit a scan to the Vercel endpoint, configure `EXPO_PUBLIC_FINX_API_URL` as the deployed site's origin (for example, `https://your-deployment.vercel.app`) before building. The app submits content only after the user taps Analyze and calls `/api/analyze`. When the server has `GEMINI_API_KEY`, the endpoint combines deterministic warning checks with Gemini risk scoring. Gemini-added warning signals must use known categories and quote an exact substring of the submitted content; the combined score cannot fall below the deterministic score. Gemini output is still probabilistic and is not proof that content is safe or fraudulent.

The Gemini key is read only by the server and must be configured as a Vercel server-side environment variable; never add it to `EXPO_PUBLIC_*`, EAS client build variables, or app code. The selected interface language is sent with a scan, and Gemini returns a short spoken explanation in that language. The result speaker announces FINX's final risk level and then reads Gemini's explanation using the device's installed voice for that language; if Gemini is unavailable, FINX reads its existing localized rule-based explanation. If Gemini is unavailable, the API explicitly returns a `backend-rules` result and the app labels the result as rule-based. If the endpoint itself is unavailable, the app uses local rules and offers a manual online retry. Any online scan sends the submitted text or URL string to the configured FINX service, which forwards it to Gemini when configured; the service does not visit submitted URLs.

The API does not fetch submitted URLs. The API's in-memory per-instance limiter is only best-effort; configure a shared rate limiter at the deployment edge before treating either unauthenticated public endpoint as production abuse-resistant.

## Gemini voice assistant

The Home screen and header open the FINX Assistant. On a supported device, the user can dictate a message, review or edit the transcription, and explicitly send it to `/api/assistant`; assistant replies are spoken using the device's text-to-speech engine and can be replayed. The conversation is kept in app memory only and is not added to scan history. Speech recognition is provided by the operating system/browser and may use its own network service. Audio is not uploaded to FINX or Gemini by this app; only the confirmed text and recent in-memory conversation are sent to the FINX backend and then Gemini. The speech-recognition config plugin adds the native microphone/speech permission declarations, so rebuild the iOS/Android app with EAS or a development build after adding the feature; the native module is not available in Expo Go.

Configure `GEMINI_API_KEY` as a **server-side Vercel environment variable** before deploying the assistant. It must never use the `EXPO_PUBLIC_` prefix or be included in a client/app build. The endpoint returns a clear setup error if the server secret is missing. `EXPO_PUBLIC_FINX_API_URL` must point to the deployed API origin. This implementation sends chat text to Google's Gemini API; review applicable privacy notices, retention settings, usage limits, and terms before public release. The endpoint has a best-effort in-memory rate limit; use a shared edge limiter and operational monitoring for production.

## Privacy and logo

Submitted content is held only in app memory for the active scan/retry and is not written to local history. The hosted endpoint receives the content only after explicit submission. History deletion removes local records; it does not remove any external data. No analytics or cloud history sync are configured.

The original F-in-shield artwork is in `assets/finx-mark.svg`; the app icon, Android adaptive icon, and splash screen are local PNG files generated from original geometric artwork. The SVG is the editable source.

## Languages, audio, and appearance

The interface supports English, Telugu, Hindi, Tamil, and Kannada, with localized scan guidance and safety tips. Some setup and authentication error details may fall back to English. Result narration and assistant replies use the device's installed text-to-speech voice for the selected language. FINX does not upload speech audio. The Profile screen lets users choose a profile picture from their photo library; the selected image reference is stored locally on the device and is not uploaded or synchronized to Firebase. Users can change or remove the picture at any time. Appearance preference is also stored locally.

On iOS and Android, the Scan screen can take a photo or choose one from the library and extract text on-device with Apple Vision / Google ML Kit. The image is not sent to the analysis API or added to scan history. Extracted text is shown for review and only submitted if the user taps Analyze; if an online analysis URL is configured, only that reviewed text is sent to it. OCR works best with clear, printed Latin text; other script recognition depends on the platform/device. The web build does not provide photo OCR. A native EAS build is required; this feature is not available in Expo Go.

## Android builds with EAS

```sh
npm install --global eas-cli
eas login
eas build:configure
# Installable internal-test APK
eas build --platform android --profile preview
# Google Play uploadable Android App Bundle
eas build --platform android --profile production
```

The development profile produces an installable development-client APK with the native modules needed for photo OCR and speech recognition. Install that APK on the phone, then run `npm run start:dev-client` on the development computer and open the project from the development client. Do not open FINX with Expo Go: Expo Go does not include these project's custom native modules. The preview profile produces an installable standalone APK; the production profile produces a Play Store App Bundle (AAB). Android launchers use the configured FINX legacy icon and padded adaptive icon; icon changes appear only after rebuilding and reinstalling the APK, not through a Metro refresh. A build is produced only after the EAS build completes successfully.

For an EAS cloud development build, first add the non-secret `EXPO_PUBLIC_FIREBASE_*` client configuration and optional `EXPO_PUBLIC_FINX_API_URL` to the EAS build environment; the local `.env.local` is git-ignored and is not uploaded. Never add private credentials such as `GEMINI_API_KEY` to the client build environment.

Before publishing on Google Play, the release owner still needs to verify the signing and Play Console account, prepare store screenshots and listing copy, complete the content rating and Data safety forms, provide a publicly accessible privacy-policy URL, and meet the current testing and target-API requirements. Because account creation is enabled, implement and verify account deletion both in-app and through a public web deletion resource before submitting. Review the data sent to Firebase and the optional analysis endpoint when completing disclosures. The optional Vercel rate limiter is instance-local and is not sufficient as the only public production abuse control. Resolve the current dependency audit advisories and complete a security review before public launch. These items cannot be completed by a local code change alone; FINX has not been submitted to Google Play.

## Vercel web deployment

Create a separate Vercel project for FINX from the team repository, with the Git branch `finx-expo-mobile` and project root `mobile`; do not change the existing Python app's Vercel project. The `mobile/vercel.json` configuration runs `npm run build:web`, publishes `dist/`, and leaves API route discovery enabled for `api/analyze.ts` and `api/assistant.ts`. Set `GEMINI_API_KEY` as a server-side Vercel environment variable for scan analysis and the assistant; never expose it to the Expo client build. After the first deployment gives you the FINX origin, set `EXPO_PUBLIC_FINX_API_URL` to that origin in the Vercel build environment and redeploy.

## Update/install the Android APK

After deploying the FINX Vercel project, from the `mobile` project directory add its non-secret base URL as `EXPO_PUBLIC_FINX_API_URL` to the EAS `preview` environment with `npx eas-cli env:set --environment preview --name EXPO_PUBLIC_FINX_API_URL --value https://your-finx-project.vercel.app --visibility plaintext`. Then build a fresh APK with `npx eas-cli build --platform android --profile preview`. When EAS reports the build as complete, open its build page on the phone and install the APK. This is a new standalone build; the old APK will not gain the new AI scan/speaking code just by reopening it. Keep `GEMINI_API_KEY` only in Vercel's server environment, not in EAS. The spoken explanation uses the device's installed voice for the chosen language; install/enable that language's speech voice in the phone's text-to-speech settings if it is unavailable.
