import { atom } from 'jotai';

export const userAtom = atom(null);
export const formDataAtom = atom({    
  username: '',
  email: '',
  fullName: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});
