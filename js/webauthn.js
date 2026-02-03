/**
 * NLBL WebAuthn Authentication System
 * Passwordless biometric authentication for owner access
 */

class WebAuthnSystem {
  constructor() {
    this.isAvailable = window.PublicKeyCredential !== undefined;
  }

  async isSupported() {
    if (!this.isAvailable) return false;
    
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (e) {
      return false;
    }
  }

  async register(username) {
    if (!await this.isSupported()) {
      throw new Error('WebAuthn not supported on this device');
    }

    try {
      // Generate registration options
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));

      const publicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'No Limits Beyond Limitations',
          id: window.location.hostname
        },
        user: {
          id: userId,
          name: username,
          displayName: username
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' }  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred'
        },
        attestation: 'direct'
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      // Store credential info (in production, send to server)
      const credentialData = {
        id: credential.id,
        rawId: this.arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: this.arrayBufferToBase64(credential.response.clientDataJSON),
          attestationObject: this.arrayBufferToBase64(credential.response.attestationObject)
        }
      };

      localStorage.setItem('webauthn_credential', JSON.stringify(credentialData));
      localStorage.setItem('webauthn_username', username);

      return { success: true, credential: credentialData };
    } catch (error) {
      console.error('[WebAuthn] Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  async authenticate() {
    if (!await this.isSupported()) {
      throw new Error('WebAuthn not supported on this device');
    }

    try {
      const storedCredential = localStorage.getItem('webauthn_credential');
      if (!storedCredential) {
        return { success: false, error: 'No credential found. Please register first.' };
      }

      const credential = JSON.parse(storedCredential);
      const challenge = crypto.getRandomValues(new Uint8Array(32));

      const publicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [{
          id: this.base64ToArrayBuffer(credential.rawId),
          type: 'public-key',
          transports: ['internal']
        }],
        userVerification: 'required',
        timeout: 60000
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      if (assertion) {
        // Successful authentication
        const username = localStorage.getItem('webauthn_username');
        
        // Set authentication token
        localStorage.setItem('no_limits_auth_token', 'webauthn-authenticated');
        
        return { 
          success: true, 
          username,
          message: 'Authentication successful' 
        };
      }

      return { success: false, error: 'Authentication failed' };
    } catch (error) {
      console.error('[WebAuthn] Authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  async authenticateWithBiometric() {
    try {
      // Request biometric authentication
      const result = await this.authenticate();
      
      if (result.success) {
        // Provide haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        return result;
      }
      
      return result;
    } catch (error) {
      console.error('[WebAuthn] Biometric error:', error);
      return { success: false, error: error.message };
    }
  }

  logout() {
    localStorage.removeItem('no_limits_auth_token');
    localStorage.removeItem('webauthn_username');
    // Note: We keep the credential for future logins
  }

  isAuthenticated() {
    return localStorage.getItem('no_limits_auth_token') === 'webauthn-authenticated';
  }

  // Utility functions
  arrayBufferToBase64(buffer) {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      view[i] = binary.charCodeAt(i);
    }
    return buffer;
  }

  // Check if device supports biometric
  async checkBiometricSupport() {
    const support = {
      webauthn: await this.isSupported(),
      fingerprint: false,
      face: false,
      platform: 'unknown'
    };

    if (support.webauthn) {
      // Try to detect specific biometric types
      const userAgent = navigator.userAgent.toLowerCase();
      
      if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        support.platform = 'ios';
        support.face = true; // Face ID
        support.fingerprint = true; // Touch ID
      } else if (userAgent.includes('android')) {
        support.platform = 'android';
        support.fingerprint = true;
        support.face = userAgent.includes('pixel'); // Pixel Face Unlock
      } else if (userAgent.includes('mac')) {
        support.platform = 'macos';
        support.fingerprint = true; // Touch ID
      } else if (userAgent.includes('windows')) {
        support.platform = 'windows';
        support.fingerprint = true; // Windows Hello
        support.face = true;
      }
    }

    return support;
  }
}

// Global instance
window.webAuthn = new WebAuthnSystem();

// UI Helper for biometric login
async function showBiometricLogin() {
  const support = await window.webAuthn.checkBiometricSupport();
  
  if (!support.webauthn) {
    alert('Biometric authentication is not supported on this device. Please use password login.');
    return;
  }

  const button = document.createElement('button');
  button.className = 'biometric-login-btn';
  button.innerHTML = support.face ? '🔐 Login with Face ID' : '🔐 Login with Fingerprint';
  button.onclick = async () => {
    button.disabled = true;
    button.innerHTML = 'Authenticating...';
    
    const result = await window.webAuthn.authenticateWithBiometric();
    
    if (result.success) {
      window.location.href = 'private.html';
    } else {
      alert(result.error || 'Authentication failed');
      button.disabled = false;
      button.innerHTML = support.face ? '🔐 Login with Face ID' : '🔐 Login with Fingerprint';
    }
  };

  return button;
}
