#!/bin/bash

# Production Build Script for Quran Revision Tracker
# This script builds the app for Google Play Store release

echo "🚀 Starting production build for Quran Revision Tracker..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf android/app/build/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the web app
echo "🔨 Building web app..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed. dist/ directory not found."
    exit 1
fi

echo "✅ Web app built successfully!"

# Sync with Capacitor
echo "📱 Syncing with Capacitor..."
npx cap sync android

# Build Android app
echo "🤖 Building Android app..."
npx cap build android --release

# Check if Android build was successful
if [ ! -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
    echo "❌ Error: Android build failed. APK not found."
    echo "💡 Make sure you have Android SDK and build tools installed."
    exit 1
fi

echo "✅ Android app built successfully!"

# Display build information
echo ""
echo "🎉 Production build completed!"
echo ""
echo "📱 Build Details:"
echo "   - App Name: Quran Revision Tracker"
echo "   - Version: 1.0.0"
echo "   - APK Location: android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "📋 Next Steps:"
echo "   1. Test the APK on different devices"
echo "   2. Upload to Google Play Console"
echo "   3. Complete store listing with assets from STORE_LISTING.md"
echo "   4. Submit for review"
echo ""
echo "🔗 Useful Files:"
echo "   - Privacy Policy: PRIVACY_POLICY.md"
echo "   - Terms of Service: TERMS_OF_SERVICE.md"
echo "   - Store Listing Guide: STORE_LISTING.md"
echo ""

# Optional: Open the APK location
read -p "Would you like to open the APK location? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open android/app/build/outputs/apk/release/
fi 