/**
 * Device identification utilities for cross-session participant tracking
 */

const DEVICE_ID_KEY = 'cda:device:id';

/**
 * Generate a stable device ID for this browser
 * Uses localStorage to persist across sessions
 */
export function getOrCreateDeviceId(): string {
	if (typeof window === 'undefined') return '';

	let deviceId = localStorage.getItem(DEVICE_ID_KEY);

	if (!deviceId) {
		// Generate a unique ID based on timestamp and random values
		deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
		localStorage.setItem(DEVICE_ID_KEY, deviceId);
		console.log('[Device] Created new device ID:', deviceId);
	} else {
		console.log('[Device] Using existing device ID:', deviceId);
	}

	return deviceId;
}

/**
 * Clear the device ID (for testing or privacy)
 */
export function clearDeviceId() {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(DEVICE_ID_KEY);
	console.log('[Device] Cleared device ID');
}
