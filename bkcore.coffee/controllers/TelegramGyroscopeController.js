/**
 * TelegramGyroscopeController
 * Gyroscope controller for Telegram Mini Apps
 * Uses Telegram WebApp API for gyroscope access and orientation control
 * 
 * @class bkcore.controllers.TelegramGyroscopeController
 * @author BKcore (Modified for Telegram Mini App)
 */

(function() {
    var TelegramGyroscopeController = function(dom, touchCallback) {
        this.dom = dom;
        this.touchCallback = touchCallback || null;
        this.active = false;
        this.ready = false;
        
        // Gyroscope data storage
        this.gyroscopeData = {
            x: 0,
            y: 0,
            z: 0,
            pitch: 0,
            roll: 0,
            yaw: 0
        };
        
        // Calibration offsets
        this.offsetPitch = 0;
        this.offsetRoll = 0;
        this.offsetYaw = 0;
        
        // Control values (mapped to ship controls)
        this.steering = 0;      // Left/right (-1 to 1)
        this.throttle = 0;      // Forward/backward (0 to 1)
        this.pitchValue = 0;    // Up/down tilt
        
        // Sensitivity settings
        this.steeringSensitivity = 1.5;
        this.throttleSensitivity = 1.0;
        this.pitchSensitivity = 1.0;
        
        // Touch handling
        this.touches = null;
        this.isTouching = false;
        
        // Reference to WebApp
        this.webApp = null;
        
        // Initialize
        this.init();
    };

    /**
     * Check if Telegram WebApp with gyroscope support is available
     */
    TelegramGyroscopeController.isCompatible = function() {
        return typeof window !== 'undefined' && 
               typeof window.Telegram !== 'undefined' &&
               typeof window.Telegram.WebApp !== 'undefined' &&
               typeof window.Telegram.WebApp.requestGyroscopePermission === 'function';
    };

    /**
     * Initialize the controller
     */
    TelegramGyroscopeController.prototype.init = function() {
        var _this = this;
        
        // Check for Telegram WebApp
        if (typeof window.Telegram !== 'undefined' && 
            typeof window.Telegram.WebApp !== 'undefined') {
            this.webApp = window.Telegram.WebApp;
            this.webApp.expand(); // Expand to full height
            
            // Set up touch listeners
            if (this.dom) {
                this.dom.addEventListener('touchstart', function(e) {
                    _this.touchStart(e);
                }, false);
                
                this.dom.addEventListener('touchend', function(e) {
                    _this.touchEnd(e);
                }, false);
                
                this.dom.addEventListener('touchcancel', function(e) {
                    _this.touchEnd(e);
                }, false);
            }
            
            console.log('TelegramGyroscopeController initialized');
        } else {
            console.warn('Telegram WebApp not available - falling back to standard orientation');
            // Try DeviceOrientation as fallback
            this.initDeviceOrientationFallback();
        }
    };

    /**
     * Initialize DeviceOrientation as fallback for non-Telegram environments
     */
    TelegramGyroscopeController.prototype.initDeviceOrientationFallback = function() {
        var _this = this;
        
        if ('DeviceOrientationEvent' in window) {
            window.addEventListener('deviceorientation', function(e) {
                _this.orientationChange(e);
            }, false);
        }
    };

    /**
     * Request gyroscope permission (Telegram API)
     */
    TelegramGyroscopeController.prototype.requestPermission = function(callback) {
        var _this = this;
        
        if (this.webApp && typeof this.webApp.requestGyroscopePermission === 'function') {
            this.webApp.requestGyroscopePermission()
                .then(function() {
                    console.log('Gyroscope permission granted');
                    _this.active = true;
                    _this.setupGyroscopeListeners();
                    if (callback) callback(true);
                })
                .catch(function(error) {
                    console.error('Gyroscope permission denied:', error);
                    _this.active = false;
                    if (callback) callback(false);
                });
        } else {
            // Try DeviceOrientation fallback
            this.requestDeviceOrientationPermission(callback);
        }
    };

    /**
     * Request DeviceOrientation permission (iOS 13+)
     */
    TelegramGyroscopeController.prototype.requestDeviceOrientationPermission = function(callback) {
        var _this = this;
        
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(function(response) {
                    if (response === 'granted') {
                        _this.active = true;
                        _this.setupDeviceOrientationListeners();
                        if (callback) callback(true);
                    } else {
                        if (callback) callback(false);
                    }
                })
                .catch(function(error) {
                    console.error('DeviceOrientation permission error:', error);
                    if (callback) callback(false);
                });
        } else {
            // Non-iOS or older devices - permission not needed
            this.active = true;
            this.setupDeviceOrientationListeners();
            if (callback) callback(true);
        }
    };

    /**
     * Set up gyroscope event listeners (Telegram API)
     */
    TelegramGyroscopeController.prototype.setupGyroscopeListeners = function() {
        var _this = this;
        
        if (this.webApp && typeof this.webApp.on === 'function') {
            // Listen for gyroscope changes
            this.webApp.on('gyroscopeChanged', function(data) {
                _this.gyroscopeData = {
                    x: data.x || 0,
                    y: data.y || 0,
                    z: data.z || 0,
                    pitch: data.pitch || 0,
                    roll: data.roll || 0,
                    yaw: data.yaw || 0
                };
                _this.updateControlValues();
            });
            
            // Listen for orientation lock status
            if (typeof this.webApp.on === 'function') {
                this.webApp.on('deviceOrientationChanged', function(data) {
                    // Handle orientation change events
                });
            }
            
            console.log('Telegram gyroscope listeners set up');
        }
    };

    /**
     * Set up DeviceOrientation event listeners (fallback)
     */
    TelegramGyroscopeController.prototype.setupDeviceOrientationListeners = function() {
        var _this = this;
        
        window.addEventListener('deviceorientation', function(e) {
            _this.orientationChange(e);
        }, false);
        
        console.log('DeviceOrientation listeners set up (fallback mode)');
    };

    /**
     * Handle device orientation change (fallback mode)
     */
    TelegramGyroscopeController.prototype.orientationChange = function(event) {
        if (!this.active) return;
        
        // Store raw orientation data
        this.gyroscopeData = {
            alpha: event.alpha || 0,  // Z-axis rotation
            beta: event.beta || 0,    // X-axis rotation
            gamma: event.gamma || 0,  // Y-axis rotation
            pitch: (event.beta || 0) - this.offsetPitch,
            roll: (event.gamma || 0) - this.offsetRoll,
            yaw: (event.alpha || 0) - this.offsetYaw
        };
        
        this.updateControlValues();
    };

    /**
     * Update control values based on gyroscope data
     */
    TelegramGyroscopeController.prototype.updateControlValues = function() {
        var pitch = this.gyroscopeData.pitch || 0;
        var roll = this.gyroscopeData.roll || 0;
        
        // Calculate steering from roll (left/right tilt)
        // Typical range: -90 to 90 degrees, we want -1 to 1
        this.steering = Math.max(-1, Math.min(1, roll / 45 * this.steeringSensitivity));
        
        // Calculate throttle from pitch (forward/backward tilt)
        // Forward tilt = accelerate, backward = brake
        // Typical range: -180 to 180, but usually -90 to 90 for phone
        this.throttle = Math.max(0, Math.min(1, (-pitch + 30) / 60 * this.throttleSensitivity));
        
        // Pitch value for additional control
        this.pitchValue = Math.max(-1, Math.min(1, pitch / 45 * this.pitchSensitivity));
    };

    /**
     * Calibrate the gyroscope (reset offsets)
     */
    TelegramGyroscopeController.prototype.calibrate = function() {
        if (this.gyroscopeData.pitch) {
            this.offsetPitch = this.gyroscopeData.pitch;
        }
        if (this.gyroscopeData.roll) {
            this.offsetRoll = this.gyroscopeData.roll;
        }
        if (this.gyroscopeData.yaw) {
            this.offsetYaw = this.gyroscopeData.yaw;
        }
        console.log('Gyroscope calibrated');
    };

    /**
     * Lock screen orientation for better gameplay
     */
    TelegramGyroscopeController.prototype.lockOrientation = function() {
        if (this.webApp && typeof this.webApp.lockOrientation === 'function') {
            this.webApp.lockOrientation();
        }
        // Fallback for non-Telegram environments
        if (screen.orientation && typeof screen.orientation.lock === 'function') {
            screen.orientation.lock('portrait');
        }
    };

    /**
     * Unlock screen orientation
     */
    TelegramGyroscopeController.prototype.unlockOrientation = function() {
        if (this.webApp && typeof this.webApp.unlockOrientation === 'function') {
            this.webApp.unlockOrientation();
        }
        // Fallback
        if (screen.orientation && typeof screen.orientation.unlock === 'function') {
            screen.orientation.unlock();
        }
    };

    /**
     * Touch start handler
     */
    TelegramGyroscopeController.prototype.touchStart = function(event) {
        if (!this.active) return;
        
        var _this = this;
        var touches = event.changedTouches;
        
        for (var i = 0; i < touches.length; i++) {
            if (typeof this.touchCallback === 'function') {
                this.touchCallback(true, touches[i], event);
            }
        }
        
        this.touches = event.touches;
        this.isTouching = true;
        
        // Auto-calibrate on first touch
        if (!this.ready) {
            this.calibrate();
            this.ready = true;
        }
    };

    /**
     * Touch end handler
     */
    TelegramGyroscopeController.prototype.touchEnd = function(event) {
        if (!this.active) return;
        
        var _this = this;
        var touches = event.changedTouches;
        
        for (var i = 0; i < touches.length; i++) {
            if (typeof this.touchCallback === 'function') {
                this.touchCallback(false, touches[i], event);
            }
        }
        
        this.touches = event.touches;
        this.isTouching = false;
    };

    /**
     * Get current steering value (-1 to 1)
     */
    TelegramGyroscopeController.prototype.getSteering = function() {
        return this.steering || 0;
    };

    /**
     * Get current throttle value (0 to 1)
     */
    TelegramGyroscopeController.prototype.getThrottle = function() {
        return this.throttle || 0;
    };

    /**
     * Get current pitch value (-1 to 1)
     */
    TelegramGyroscopeController.prototype.getPitch = function() {
        return this.pitchValue || 0;
    };

    /**
     * Check if controller is ready and active
     */
    TelegramGyroscopeController.prototype.isReady = function() {
        return this.ready && this.active;
    };

    /**
     * Activate the controller
     */
    TelegramGyroscopeController.prototype.activate = function() {
        this.active = true;
        this.ready = true;
    };

    /**
     * Deactivate the controller
     */
    TelegramGyroscopeController.prototype.deactivate = function() {
        this.active = false;
    };

    /**
     * Clean up listeners
     */
    TelegramGyroscopeController.prototype.dispose = function() {
        this.active = false;
        this.deactivate();
        
        if (this.dom) {
            this.dom.removeEventListener('touchstart', this.touchStart);
            this.dom.removeEventListener('touchend', this.touchEnd);
            this.dom.removeEventListener('touchcancel', this.touchEnd);
        }
        
        if (this.webApp && typeof this.webApp.off === 'function') {
            this.webApp.off('gyroscopeChanged');
        }
    };

    // Export
    var exports = exports || {};
    exports.bkcore = exports.bkcore || {};
    exports.bkcore.controllers = exports.bkcore.controllers || {};
    exports.bkcore.controllers.TelegramGyroscopeController = TelegramGyroscopeController;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TelegramGyroscopeController;
    }

    // Also make available globally
    if (typeof window !== 'undefined') {
        window.bkcore = window.bkcore || {};
        window.bkcore.controllers = window.bkcore.controllers || {};
        window.bkcore.controllers.TelegramGyroscopeController = TelegramGyroscopeController;
    }

})();

