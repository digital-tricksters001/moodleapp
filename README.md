# Moodle Mobile App (Next-Gen Enhanced Edition)

[![Moodle Mobile Version](https://img.shields.io/badge/Moodle%20App-v5.2.1-orange.svg)](https://github.com/digital-tricksters001/moodleapp)
[![Framework](https://img.shields.io/badge/Framework-Ionic%207%20%7C%20Angular%2018-blue.svg)](https://ionicframework.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE.txt)
[![Developer](https://img.shields.io/badge/Developer-Suman%20Kumar%20Das-indigo.svg)](mailto:fysuman20@gmail.com)

Welcome to the **Next-Gen Enhanced Edition** of the official Moodle Mobile App (built on upstream baseline **v5.2.1**). This edition delivers a modernized UI/UX design system, deep Obsidian Dark Mode, enterprise administration tools, and a dynamic branding engine that allows administrators to customize and broadcast brand identities directly to student devices without rebuilding native application packages.

Developed and maintained by **Suman Kumar Das** ([fysuman20@gmail.com](mailto:fysuman20@gmail.com)).

---

## 🌟 What's New & Added Features

### 1. 🎨 Dynamic Admin & Branding Engine
- **Live In-App Theme Customizer**: Administrators and managers can access *Settings &rarr; Administration & Branding* directly from the mobile app.
- **Color Swatches & Custom Hex Picker**: Instant 1-tap switching between curated enterprise palettes (Indigo Enterprise, Emerald Modern, Crimson Accent, Amber Pro, Deep Violet, Ocean Cyan, Moodle Classic) or enter any hex color.
- **Live DOM Variable Injection**: Changes take effect immediately across all app views by injecting CSS custom properties into `:root` at runtime (`--ion-color-primary`, `--brand-color`, `--card-radius`, etc.).
- **Logo & Title Overrides**: Configure custom logo image URLs and custom application headings.
- **Card Corner Radius Switcher**: Toggle between Modern Round (16px squircle), Compact Soft (8px), and Sharp (4px) card geometries.

### 2. 📡 1-Click Server Broadcast (Deliver Theme to All Students)
- **Zero-Rebuild Theme Distribution**: Push brand themes to **every student's installed Moodle app** without app store resubmissions.
- **Direct Web Service Push**: Sends branding configuration to Moodle's `tool_mobile` backend configuration.
- **One-Click Mobile CSS Snippet Generator**: Automatically generates and copies the exact CSS payload for Moodle Web (*Site administration &rarr; Mobile app &rarr; Mobile appearance &rarr; Custom mobile CSS*).
- **Automatic Client Polling**: Students' installed apps sync and apply the new brand theme on their next application launch.

### 3. ✨ Modern Glassmorphic Design System
- **Frosted Glass Header & Navigation**: Translucent backdrop blur (`backdrop-filter: blur(16px)`) with crisp hairline borders on both iOS and Android.
- **Floating Bottom Navigation Bar**: Modern pill-shaped floating tab dock with responsive active indicator animations.
- **Squircle Course & Activity Cards**: Multi-tiered box shadows, modern border radii, and accent progress rings.
- **Deep Obsidian Dark Mode**: Refined dark theme (`#0B0F19` background, `#151C2C` elevated cards) with high-contrast typography and reduced OLED battery consumption.
- **Enhanced Form Controls**: Polished inputs with smooth focus ring glow and tactile feedback.

### 4. ⚡ Enterprise Diagnostic & Management Tools
- **1-Click Multi-Tiered Cache Purge**: Invalidate memory caches, SQLite offline stores, and stale API responses instantly without logging out.
- **Web Service Latency Pinger**: Measures real-time round-trip latency to your Moodle server via `core_webservice_get_site_info`.
- **JSON Diagnostic Exporter**: Export site metadata, device telemetry, and web service configurations for rapid troubleshooting.

### 5. 📱 Platform-Specific Fixes (Android & iOS)
- **Eliminated iOS WKWebView Auto-Zoom**: Enforced `font-size: 16px` on form controls to prevent iOS Safari/WKWebView viewport displacement when tapping inputs.
- **Safe-Area Clamping for Notches & Dynamic Island**: Dynamic inset padding (`max(var(--ion-safe-area-bottom), env(safe-area-inset-bottom))`) prevents content clipping on modern iPhones and Android 14+ gesture bars.
- **Hardware Acceleration Layering**: Hardware-promoted rendering (`transform: translateZ(0)`) prevents backdrop filter flickering during rapid inertial scrolling.
- **Android Tap-Flash Removal**: Injected `-webkit-tap-highlight-color: transparent` to eliminate grey box flashing on mobile touch events.

---

## 🚀 Quick Start for Developers

### Prerequisites
- **Node.js**: `v22.15.0` or `>= v22.17.0 < 23`
- **npm**: `v10.9.2+`
- **Java Development Kit (JDK)**: OpenJDK 17+ (for Android builds)
- **Android SDK**: Build tools 34+ / Platform SDK 34-36 (for Android builds)
- **macOS & Xcode**: 15+ with CocoaPods (for iOS builds)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/digital-tricksters001/moodleapp.git
cd moodleapp

# Install root dependencies
npm install --engine-strict=false

# Install native plugin dependencies
npm install --prefix cordova-plugin-moodleapp
```

### 2. Compile Language Packs & Environment
```bash
# Compile lang files, environment config, and icon registries
npx gulp
```

### 3. Run Development Web Server
```bash
npm run start
```
The app will open at `https://localhost:8100/`.

---

## 🛠️ Building Native Apps (Android & iOS)

For the complete, step-by-step native compilation, signing, and store deployment guide, please refer to:
👉 **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)**

### Quick Android Build
```bash
# Development debug build
npx ionic cordova build android

# Production release AAB bundle for Google Play
npx ionic cordova build android --prod --release -- --packageType=bundle
```

### Quick iOS Build (macOS)
```bash
# Build iOS workspace
npx ionic cordova prepare ios --prod

# Open in Xcode for signing & App Store archive
open platforms/ios/Moodle.xcworkspace
```

---

## 🧪 Testing & Code Quality

```bash
# Run unit tests with Jest
npm run test:ci

# Run ESLint across TypeScript, HTML, and SCSS
npm run lint -- --quiet

# Verify translation index synchronization
npm run lang:update-langpacks
```

---

## 📂 Repository Structure

```
moodleapp/
├── src/
│   ├── app/                      # Angular root application module and bootstrapper
│   ├── assets/                   # Static assets, fonts, icons, and compiled lang packs
│   ├── core/
│   │   ├── classes/              # Core site, cache, and HTTP client infrastructure
│   │   ├── features/
│   │   │   └── settings/         # Settings module, including Admin & Branding view
│   │   │       ├── pages/admin/  # Admin page component, HTML template, and SCSS
│   │   │       └── services/     # AdminBrandingService (Dynamic CSS injection engine)
│   │   └── services/             # Navigation, database, network, and plugin services
│   └── theme/
│       ├── globals.custom.scss   # Color scales, typography, and utility tokens
│       └── theme.custom.scss     # Glassmorphic UI/UX theme and Obsidian Dark Mode
├── cordova-plugin-moodleapp/     # Native Cordova bridge plugin (secure storage, push, crypto)
├── scripts/                      # Language pack compilers, CI validators, and build helpers
├── DEVELOPER_GUIDE.md            # Comprehensive Native Build and Technical Guide
└── README.md                     # Project landing documentation
```

---

## 👨‍💻 Developer & Author

- **Author**: **Suman Kumar Das**
- **Email**: [fysuman20@gmail.com](mailto:fysuman20@gmail.com)
- **Repository**: [digital-tricksters001/moodleapp](https://github.com/digital-tricksters001/moodleapp)

---

## 📄 License

This project is licensed under the **Apache License, Version 2.0**. See the [LICENSE.txt](LICENSE.txt) file for details.
