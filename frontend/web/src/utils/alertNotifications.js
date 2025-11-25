/**
 * Utility functions for alert notifications and sounds
 */

/**
 * Play alert sound using Web Audio API
 * Creates a beep/ping sound for alerts
 */
export const playAlertSound = () => {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create oscillator for beep sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configure sound
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set frequency for alert sound (higher pitch for urgency)
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    // Set volume envelope (fade in/out)
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    // Play sound
    oscillator.start(now);
    oscillator.stop(now + 0.3);
    
    // Cleanup
    oscillator.onended = () => {
      audioContext.close();
    };
  } catch (error) {
    console.warn('Failed to play alert sound:', error);
    // Fallback: try HTML5 audio
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OSdTgwOUKjj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBtpvfDknU4MDlCo4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC');
      audio.volume = 0.5;
      audio.play().catch(err => console.warn('Audio play failed:', err));
    } catch (fallbackError) {
      console.warn('Fallback audio also failed:', fallbackError);
    }
  }
};

/**
 * Play critical alert sound (more urgent)
 */
export const playCriticalAlertSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Play two beeps for critical alerts
    for (let i = 0; i < 2; i++) {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 1000; // Higher pitch
        oscillator.type = 'sine';
        
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        oscillator.start(now);
        oscillator.stop(now + 0.2);
      }, i * 250);
    }
  } catch (error) {
    console.warn('Failed to play critical alert sound:', error);
    // Fallback: play regular sound twice
    playAlertSound();
    setTimeout(playAlertSound, 250);
  }
};

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

/**
 * Show browser notification for alert
 */
export const showAlertNotification = (alert) => {
  if (!('Notification' in window)) {
    return;
  }
  
  if (Notification.permission === 'granted') {
    const title = alert.severity === 'critical' || alert.severity === 'high' 
      ? `🚨 ${alert.severity.toUpperCase()} ALERT` 
      : `⚠️ Wildlife Alert`;
    
    const body = alert.animalName 
      ? `${alert.animalName} (${alert.animalSpecies || 'Unknown'})\n${alert.message || alert.title || 'Alert detected'}`
      : alert.message || alert.title || 'Wildlife alert detected';
    
    const notification = new Notification(title, {
      body: body,
      icon: '/favicon.webp',
      badge: '/favicon.webp',
      tag: `alert-${alert.id}`, // Prevent duplicate notifications
      requireInteraction: alert.severity === 'critical', // Critical alerts require interaction
      vibrate: alert.severity === 'critical' ? [200, 100, 200, 100, 200] : [200, 100, 200],
    });
    
    // Auto-close after 5 seconds (unless critical)
    if (alert.severity !== 'critical') {
      setTimeout(() => notification.close(), 5000);
    }
    
    // Handle click to focus window
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
};

/**
 * Handle new alert: play sound and show notification
 */
export const handleNewAlert = async (alert) => {
  // Play sound based on severity
  if (alert.severity === 'critical' || alert.severity === 'high') {
    playCriticalAlertSound();
  } else {
    playAlertSound();
  }
  
  // Request permission and show notification
  const hasPermission = await requestNotificationPermission();
  if (hasPermission) {
    showAlertNotification(alert);
  }
};

