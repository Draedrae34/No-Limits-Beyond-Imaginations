document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('reset-form');
  const resetCodeInput = document.getElementById('resetCode');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const messageEl = document.getElementById('reset-message');

  function setMessage(text, isError = true) {
    messageEl.textContent = text;
    messageEl.style.color = isError ? '#ff5c5c' : '#7dd181';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const resetCode = resetCodeInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!resetCode || !newPassword || !confirmPassword) {
      setMessage('All fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('/api/auth?action=reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetCode, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || 'Password reset failed.');
        return;
      }

      setMessage('Password reset complete. Use the new password on the login page.', false);
      resetCodeInput.value = '';
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
    } catch (error) {
      console.error('Reset request failed:', error);
      setMessage('Unable to reset password. Try again later.');
    }
  });
});
