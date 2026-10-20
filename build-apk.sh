#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_PROJECT_DIR="$SCRIPT_DIR/android"

echo "=== Subway Runner Android APK Builder ==="
echo "Project Directory: $ANDROID_PROJECT_DIR"

# 1. Check JDK
if ! command -v javac >/dev/null 2>&1; then
    echo "[ERROR] Java Compiler (javac) is missing."
    echo "Please install JDK 17+ (e.g. sudo apt install openjdk-17-jdk)"
    exit 1
fi

JAVA_VERSION=$(javac -version 2>&1 | awk '{print $2}')
echo "[OK] JDK Compiler found: $JAVA_VERSION"

# 2. Check Android SDK
if [ -z "${ANDROID_HOME:-}" ] && [ -z "${ANDROID_SDK_ROOT:-}" ]; then
    echo "[WARNING] ANDROID_HOME / ANDROID_SDK_ROOT is not set in environment."
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
        echo "[INFO] Using default Android SDK path: $ANDROID_HOME"
    else
        echo "[ERROR] Android SDK not located. Please install Android command-line tools or Android Studio."
        exit 1
    fi
fi

# 3. Build APK
echo "[INFO] Starting Gradle assembleDebug..."
cd "$ANDROID_PROJECT_DIR"

if command -v gradle >/dev/null 2>&1; then
    gradle assembleDebug
else
    echo "[ERROR] Gradle is not installed on PATH."
    echo "Install gradle via package manager or download the Gradle wrapper."
    exit 1
fi

APK_PATH="$ANDROID_PROJECT_DIR/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo "[SUCCESS] APK built successfully!"
    echo "Location: $APK_PATH"
else
    echo "[ERROR] Build completed but APK was not found at expected location: $APK_PATH"
    exit 1
fi
