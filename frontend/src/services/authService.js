import { authApi } from './api';

export async function registerUser(payload) {
  return authApi.post('/auth/register', payload);
}

export async function verifyRegisterOtp(payload) {
  return authApi.post('/auth/verify-register-otp', payload);
}

export async function loginUser(payload) {
  return authApi.post('/auth/login', payload);
}

export async function verifyLoginOtp(payload) {
  return authApi.post('/auth/verify-login-otp', payload);
}

export async function fetchAuthProfile() {
  return authApi.get('/auth/profile');
}

export async function logoutUser() {
  return authApi.post('/auth/logout');
}

export async function changePassword(payload) {
  return authApi.patch('/auth/change-password', payload);
}
