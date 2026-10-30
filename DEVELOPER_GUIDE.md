# Moodle Mobile App Developer Guide & Native Build Manual

**Author & Lead Developer:** Suman Kumar Das ([fysuman20@gmail.com](mailto:fysuman20@gmail.com))  
**Repository:** [https://github.com/digital-tricksters001/moodleapp](https://github.com/digital-tricksters001/moodleapp)  
**App Baseline:** Moodle Mobile v5.2.1 | Ionic 7 | Angular 18 | Apache Cordova 12+  

---

## Table of Contents
1. [Overview & Architectural Upgrades](#1-overview--architectural-upgrades)
2. [Feature Comparison: Stock vs Enhanced Edition](#2-feature-comparison-stock-vs-enhanced-edition)
3. [Dynamic Branding Architecture & Theming Mechanics](#3-dynamic-branding-architecture--theming-mechanics)
4. [Android Native Build Manual (Normal / Standard Method)](#4-android-native-build-manual-normal--standard-method)
   - [Environment Setup & SDK Configuration](#41-environment-setup--sdk-configuration)
   - [Adding Android Platform](#42-adding-android-platform)
   - [Development & Debug Builds](#43-development--debug-builds)
   - [Production Release Build (.aab / .apk)](#44-production-release-build-aab--apk)
   - [Keystore Generation & Cryptographic Signing](#45-keystore-generation--cryptographic-signing)
5. [iOS Native Build Manual (Normal / Standard Method)](#5-ios-native-build-manual-normal--standard-method)
   - [Environment Setup & Xcode Configuration](#51-environment-setup--xcode-configuration)
   - [Adding iOS Platform & Pod Installation](#52-adding-ios-platform--pod-installation)
   - [Simulator & Device Testing](#53-simulator--device-testing)
   - [Xcode Archive & App Store Distribution](#54-xcode-archive--app-store-distribution)
6. [Platform-Specific Native Fixes Reference](#6-platform-specific-native-fixes-reference)
7. [Testing, Linting & CI/CD Pipeline](#7-testing-linting--cicd-pipeline)

---

## 1. Overview & Architectural Upgrades

This enhanced edition of the Moodle Mobile App transforms the standard open-source Moodle client into an enterprise-ready, white-label capable learning application. It provides native multi-tenant administrators with live in-app branding controls and a server-synchronized broadcast pipeline that updates student applications dynamically.

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Device                             │
│  Settings > Administration & Branding                       │
│  - Select Swatch / Custom Hex                               │
│  - Set Corner Radius & Logo URL                             │
│  - Click "Broadcast to All Students"                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Moodle Web Server                           │
│  - Site Administration > Mobile App > Mobile Appearance     │
│  - Custom Mobile CSS updated via Web Service / Clipboard     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ (Next App Launch / Sync)
┌─────────────────────────────────────────────────────────────┐
│               Student Installed Apps                        │
│  - CoreSites / tool_mobile sync loads custom CSS            │
│  - CoreAdminBrandingService injects CSS variables into DOM  │
│  - UI updates immediately with zero native app rebuilding!  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Feature Comparison: Stock vs Enhanced Edition

| Feature Capability | Stock Moodle App (v5.2.1) | Enhanced Edition (by Suman Kumar Das) |
|---|---|---|
| **Admin Settings View** | ❌ None (only standard developer options) | ✅ Dedicated `Settings > Administration & Branding` panel |
| **In-App Color Customizer** | ❌ Hardcoded in SCSS / require rebuild | ✅ 7 Curated Presets + Custom Hex Color Picker |
| **Live DOM Theming** | ❌ Static stylesheets | ✅ Dynamic runtime CSS variable injection via `CoreAdminBrandingService` |
| **Corner Radius Switcher** | ❌ Fixed 8px border-radius | ✅ 3 Geometry modes: Modern Squircle (16px), Compact (8px), Sharp (4px) |
| **Broadcast Theme to Students** | ❌ Manual re-compilation of mobile app | ✅ 1-Click Server Broadcast (direct WS push + auto-generated CSS snippet) |
| **UI/UX Aesthetics** | ⚠️ Flat legacy Material / iOS | ✅ Frosted glassmorphism, floating navigation dock, multi-tier card depth |
| **Dark Mode Architecture** | ⚠️ Standard dark grey palette | ✅ Deep Obsidian Dark Mode (`#0B0F19`) optimized for OLED screens |
| **Diagnostics & Cache** | ❌ Requires app data clear / reinstall | ✅ 1-Click Multi-Tier Cache Invalidator + Live WS latency ping |
| **iOS Input Auto-Zoom** | ⚠️ Viewport shifts on input focus | ✅ Enforced 16px base font size to eliminate auto-zoom |
| **Safe-Area Insets** | ⚠️ Content sometimes clips under notches | ✅ Adaptive `env(safe-area-inset-bottom)` safe-area padding |
| **Android Tap Highlights** | ⚠️ Grey box flash on card touch | ✅ Fully suppressed with transparent tap highlighting |

---

## 3. Dynamic Branding Architecture & Theming Mechanics

### Service Architecture: `CoreAdminBrandingService`
Located at `src/core/features/settings/services/admin-branding.ts`:
- **State Persistence**: Uses Moodle's native `CoreConfig` storage provider (backed by IndexedDB on web and SQLite on native iOS/Android).
- **CSS Variable Injection**: Dynamically injects a `<style id="core-admin-dynamic-branding">` node into `<head>`:
  ```typescript
  const style = `:root {
      --ion-color-primary: ${branding.primaryColor};
      --brand-color: ${branding.primaryColor};
      --core-bottom-tabs-color-selected: ${branding.primaryColor};
      --core-header-toolbar-background: ${branding.primaryColor};
      --card-radius: ${branding.borderRadius};
      --ion-card-radius: ${branding.borderRadius};
  }`;
  ```
- **App Boot Sequence**: Hooked directly into `AppComponent.ngOnInit()` (`src/app/app.component.ts`) using Angular 18's modern `inject(CoreAdminBrandingService)` pattern, ensuring persistent colors are applied before the first view paints.

---

## 4. Android Native Build Manual (Normal / Standard Method)

This section details the standard production workflow to compile, build, sign, and export standalone Android `.apk` (for direct distribution) and `.aab` (Android App Bundle for the Google Play Store).

### 4.1 Environment Setup & SDK Configuration

1. **Install Java Development Kit (JDK 17)**:
   - Ensure OpenJDK 17 is installed. Set your environment variables:
     ```powershell
     # Windows PowerShell
     [System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot", "User")
     ```
     ```bash
     # macOS / Linux
     export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"
     ```

2. **Install Android Command-Line Tools & SDK Platforms**:
   - Open Android Studio &rarr; SDK Manager:
     - **SDK Platforms**: Android 14 (API 34) or Android 15 (API 35).
     - **SDK Tools**: Android SDK Build-Tools 34.0.0+, Android SDK Command-line Tools (latest), Android SDK Platform-Tools.
   - Configure environment variables:
     ```powershell
     # Windows
     $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
     $env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin"
     ```
     ```bash
     # macOS / Linux
     export ANDROID_HOME="$HOME/Library/Android/sdk"
     export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"
     ```

3. **Install Global Build Utilities**:
   ```bash
   npm install -g @ionic/cli cordova
   ```

---

### 4.2 Adding Android Platform

```bash
# Navigate to the project root
cd moodleapp

# Ensure dependencies are installed
npm install --engine-strict=false
npm install --prefix cordova-plugin-moodleapp

# Compile languages and config
npx gulp

# Add Cordova Android platform
npx cordova platform add android@^13.0.0
```

---

### 4.3 Development & Debug Builds

To test directly on a connected USB Android device (with USB Debugging enabled in Developer Options):

```bash
# Build and run debug APK with live reload on device
npm run dev:android

# Or build debug APK directly:
npx ionic cordova build android
```
The output debug APK will be created at:
`platforms/android/app/build/outputs/apk/debug/app-debug.apk`

---

### 4.4 Production Release Build (.aab / .apk)

#### For Google Play Store (Android App Bundle - `.aab`):
```bash
# Step 1: Compile native Cordova plugin in production mode
npm run prod --prefix cordova-plugin-moodleapp

# Step 2: Build optimized production bundle
NODE_OPTIONS="--max-old-space-size=8192" NODE_ENV=production npx ionic cordova build android --prod --release -- --packageType=bundle
```
The unsigned release bundle will be generated at:  
`platforms/android/app/build/outputs/bundle/release/app-release.aab`

#### For Standalone Sideloading (Universal `.apk`):
```bash
NODE_OPTIONS="--max-old-space-size=8192" NODE_ENV=production npx ionic cordova build android --prod --release -- --packageType=apk
```
The unsigned release APK will be generated at:  
`platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

### 4.5 Keystore Generation & Cryptographic Signing

1. **Generate a Production Signing Keystore** (if you don't already have one):
   ```bash
   keytool -genkey -v -keystore moodle-release.keystore -alias moodle-key -keyalg RSA -keysize 2048 -validity 10000
   ```
   *(Keep this keystore file and password in a safe, secure location).*

2. **Sign the `.aab` Bundle (for Google Play)**:
   ```bash
   jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore moodle-release.keystore platforms/android/app/build/outputs/bundle/release/app-release.aab moodle-key
   ```

3. **Sign the `.apk` (for Direct Distribution)**:
   ```bash
   # Align the uncompressed data in the APK
   zipalign -v 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk Moodle-v5.2.1-Signed.apk

   # Cryptographically sign using apksigner
   apksigner sign --ks moodle-release.keystore --ks-key-alias moodle-key Moodle-v5.2.1-Signed.apk

   # Verify the signature
   apksigner verify --verbose Moodle-v5.2.1-Signed.apk
   ```

---

## 5. iOS Native Build Manual (Normal / Standard Method)

Native iOS applications must be built on macOS using Apple's official Xcode toolchain.

### 5.1 Environment Setup & Xcode Configuration

1. **Install macOS Tools**:
   - Install **Xcode 15+** from the Mac App Store.
   - Install Xcode Command Line Tools:
     ```bash
     xcode-select --install
     ```
   - Install **CocoaPods** (dependency manager for iOS native frameworks):
     ```bash
     sudo gem install cocoapods
     ```

2. **Apple Developer Account**:
   - Ensure you are signed in to Xcode with your Apple ID (*Xcode &rarr; Settings &rarr; Accounts*).
   - Ensure an active Apple Developer Program membership is configured.

---

### 5.2 Adding iOS Platform & Pod Installation

```bash
cd moodleapp

# Ensure dependencies and assets are compiled
npm install --engine-strict=false
npm install --prefix cordova-plugin-moodleapp
npx gulp

# Add Cordova iOS platform
npx cordova platform add ios@^7.0.0

# Prepare and sync web assets into native iOS project
NODE_ENV=production npx ionic cordova prepare ios --prod
```

---

### 5.3 Simulator & Device Testing

To run on an iOS Simulator:
```bash
# List available simulators
npx cordova run ios --list

# Run on iPhone 15 Pro simulator
npx ionic cordova run ios --target="iPhone-15-Pro"
```

To run on a physical iPhone connected via USB:
1. Connect the iPhone and trust your Mac.
2. Run:
   ```bash
   npx ionic cordova run ios --device --developmentTeam="YOUR_TEAM_ID"
   ```

---

### 5.4 Xcode Archive & App Store Distribution

1. **Open the Generated Workspace in Xcode**:
   ```bash
   open platforms/ios/Moodle.xcworkspace
   ```
   *(Always open `.xcworkspace`, never `.xcodeproj`, to include CocoaPod dependencies).*

2. **Configure Signing & Capabilities**:
   - Select the root **Moodle** project in the navigator.
   - Navigate to the **Signing & Capabilities** tab.
   - Check **"Automatically manage signing"**.
   - Select your **Team** from the dropdown.
   - Verify that your **Bundle Identifier** matches your Apple Developer portal identifier (e.g., `com.yourcompany.moodle`).

3. **Configure Build Settings**:
   - Under **General &rarr; Deployment Info**, ensure **iOS 15.0** or higher is targeted.
   - In the scheme selector toolbar at the top, select **Moodle &gt; Any iOS Device (arm64)**.

4. **Create Archive**:
   - In Xcode menu, select **Product &rarr; Archive**.
   - Once the compilation completes, the **Organizer** window opens automatically.
   - Click **Distribute App**.
   - Select **App Store Connect** &rarr; **Upload** (or **Export** for local IPA creation).
   - Follow prompts for automated signing and upload to **TestFlight** / **App Store**.

---

## 6. Platform-Specific Native Fixes Reference

### 1. Viewport Auto-Zoom Fix (iOS WKWebView)
- **Problem**: When a user taps an input field in Safari or WKWebView on iOS, the browser auto-zooms into the viewport if the element's effective computed `font-size` is under 16px. This causes awkward sideways page shifting.
- **Solution Applied**: Enforced strict `font-size: 16px !important;` across all `<input>`, `<textarea>`, `<ion-input>`, and `<ion-textarea>` elements in mobile viewport configurations (`src/theme/theme.custom.scss`).

### 2. Notch & Dynamic Island Safe-Area Inset Clamping
- **Problem**: On iPhone X through iPhone 16 Pro models with physical screen cutouts and Dynamic Island, content can collide with bottom navigation bars or home indicator bars.
- **Solution Applied**: Implemented viewport-safe clamping in SCSS:
  ```scss
  padding-bottom: max(var(--ion-safe-area-bottom, 0px), env(safe-area-inset-bottom, 0px));
  ```

### 3. Hardware Acceleration Layering
- **Problem**: Fast scrolling over elements using CSS `backdrop-filter: blur(...)` can cause micro-stutters and redraw artifacts on iOS WebKit and Android WebView.
- **Solution Applied**: Promoted blurred toolbars to dedicated GPU compositor layers via:
  ```scss
  transform: translateZ(0);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  ```

### 4. Tap Highlight Color Suppression (Android)
- **Problem**: Android WebView renders a persistent grey or blue bounding box over clickable cards during touch gestures.
- **Solution Applied**: Added `-webkit-tap-highlight-color: transparent !important;` to eliminate tap flash artifacts on interactive cards.

---

## 7. Testing, Linting & CI/CD Pipeline

To ensure the project remains stable and conforms to Moodle's enterprise coding standards:

```bash
# 1. Check code formatting & linting
npm run lint -- --quiet

# 2. Run unit tests with Jest
npm run test:ci

# 3. Synchronize and validate language index
npx gulp lang
npm run lang:update-langpacks

# 4. Production web asset build
npm run build:prod
```

### GitHub Actions CI Workflow
The repository is continuously verified via `.github/workflows/testing.yml`, which executes:
1. `npm ci --no-audit` for root and native plugin.
2. `npx gulp lang` + language pack consistency check (`Check langindex`).
3. ESLint verification on TypeScript, Angular templates, and SCSS.
4. Jest unit tests in isolated environments.
5. Production bundle validation with circular dependency auditing.

---

## 👨‍💻 Developer Attribution

**Developer:** Suman Kumar Das  
**Email:** [fysuman20@gmail.com](mailto:fysuman20@gmail.com)  
**GitHub:** [digital-tricksters001](https://github.com/digital-tricksters001)  
**Project Repository:** [digital-tricksters001/moodleapp](https://github.com/digital-tricksters001/moodleapp)
