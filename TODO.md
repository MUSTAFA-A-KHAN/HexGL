# Telegram Mini App Gyroscope Integration - Implementation Plan

## Phase 1: Controller Development ✅
- [x] Create TelegramGyroscopeController.js with Telegram WebApp API integration
- [x] Implement permission request handling
- [x] Implement gyroscope data event handlers
- [x] Add orientation locking support

## Phase 2: Main Game Integration ✅  
- [x] Update index.html with Telegram WebApp script
- [x] Add new controller to game
- [x] Add gyroscope control type option to menu

## Phase 3: Control System Updates ✅
- [x] Update ShipControls.js for Telegram control type
- [x] Map gyroscope data to ship controls
- [x] Add sensitivity calibration options

## Phase 4: Testing & Refinement
- [ ] Test permission flow
- [ ] Test gyroscope data mapping
- [ ] Test orientation locking
- [ ] Test fallback behaviors

## Key Telegram API Features to Implement:
- [x] `WebApp.requestGyroscopePermission()`
- [x] `WebApp.on('gyroscopeChanged', callback)`
- [x] `WebApp.Gyroscope` data mapping (x, y, z, pitch, roll, yaw)
- [x] `WebApp.lockOrientation()` / `WebApp.unlockOrientation()`

## Control Type Mapping:
- Type 0: Keyboard
- Type 1: Touch  
- Type 2: Leap Motion
- Type 3: Gamepad
- Type 4: Device Orientation
- **Type 5: Telegram Gyroscope (NEW)**

## Implementation Files:
1. `/workspaces/HexGL/bkcore.coffee/controllers/TelegramGyroscopeController.js` - New controller ✅
2. `/workspaces/HexGL/index.html` - Add Telegram script, update control types ✅
3. `/workspaces/HexGL/bkcore/hexgl/ShipControls.js` - Add Telegram control support ✅
4. `/workspaces/HexGL/launch.js` - Add Telegram control to menu ✅

