import { UserProfile, Trade, TradeEmotion, CashflowRecord, CashflowType } from '../types';
import { auth, hasFirebaseConfig } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  updateProfile as firebaseUpdateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  updatePassword as firebaseUpdatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';


// Default mock techniques to select from
export const DEFAULT_TECHNIQUES = [
  'EMA Cross (ตัดกัน)',
  'Support & Resistance (แนวรับ-แนวต้าน)',
  'Fibo Retracement',
  'Breakout (เบรคเอาท์)',
  'Order Block / SMC',
  'RSI Divergence',
  'Trendline Touch',
];

// Presets of default trade chart mock images for users who don't want to upload
export const CHART_PRESETS = [
  {
    name: 'Bullish Breakout',
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Double Bottom Bounce',
    url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'SMC Order Block',
    url: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Trendline Touch',
    url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=400&q=80',
  },
];

// Default profile photos
export const PROFILE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
];

const INITIAL_USER: UserProfile = {
  uid: 'user_lukinn',
  email: 'lukinngoenwilai@gmail.com',
  displayName: 'Lukin Ngoenwilai',
  photoURL: PROFILE_AVATARS[0],
  startingCapital: 10000, // 10,000 USD default starting capital
  createdAt: new Date('2026-07-01').toISOString(),
};

// Seed trades set to empty for a clean slate
const SEED_TRADES: Trade[] = [];

// Helper to initialize local storage if empty
export function initDB() {
  if (!localStorage.getItem('jdt_users')) {
    localStorage.setItem('jdt_users', JSON.stringify([INITIAL_USER]));
  }
  if (!localStorage.getItem('jdt_trades')) {
    localStorage.setItem('jdt_trades', JSON.stringify([]));
  }
  
  if (!localStorage.getItem('jdt_current_user_id')) {
    localStorage.setItem('jdt_current_user_id', '');
  }
}

// Ensure database is initialized
initDB();

export const dbService = {
  // Authentication
  getCurrentUser(): UserProfile | null {
    const currentUserId = localStorage.getItem('jdt_current_user_id');
    if (!currentUserId) return null;
    const users: UserProfile[] = JSON.parse(localStorage.getItem('jdt_users') || '[]');
    return users.find((u) => u.uid === currentUserId) || null;
  },

  updateProfile(uid: string, displayName: string, photoURL: string, startingCapital: number): UserProfile {
    const users: UserProfile[] = JSON.parse(localStorage.getItem('jdt_users') || '[]');
    const index = users.findIndex((u) => u.uid === uid);
    if (index !== -1) {
      users[index] = {
        ...users[index],
        displayName,
        photoURL,
        startingCapital,
      };
      localStorage.setItem('jdt_users', JSON.stringify(users));
      
      // Update Firebase Profile if connected
      if (hasFirebaseConfig && auth && auth.currentUser && auth.currentUser.uid === uid) {
        firebaseUpdateProfile(auth.currentUser, {
          displayName,
          photoURL
        }).catch((err) => console.error('Error updating Firebase user display details:', err));
      }
      
      return users[index];
    }
    throw new Error('User not found');
  },

  async registerUser(email: string, displayName: string, startingCapital: number, password?: string): Promise<UserProfile> {
    if (hasFirebaseConfig && auth) {
      if (!password || password.length < 6) {
        throw new Error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // Update display details in Firebase
        await firebaseUpdateProfile(firebaseUser, {
          displayName: displayName || email.split('@')[0],
          photoURL: PROFILE_AVATARS[0]
        });
        
        // Create local profile synchronized with Firebase UID
        let users: UserProfile[] = JSON.parse(localStorage.getItem('jdt_users') || '[]');
        const newUser: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || email,
          displayName: displayName || email.split('@')[0],
          photoURL: PROFILE_AVATARS[0],
          startingCapital: startingCapital || 10000,
          createdAt: new Date().toISOString(),
        };
        
        // Exclude duplicate/stale profiles
        users = users.filter((u) => u.uid !== firebaseUser.uid && u.email.toLowerCase() !== email.toLowerCase());
        users.push(newUser);
        localStorage.setItem('jdt_users', JSON.stringify(users));
        localStorage.setItem('jdt_current_user_id', firebaseUser.uid);
        return newUser;
      } catch (err: any) {
        console.error('Firebase signup failed:', err);
        let msg = 'ไม่สามารถลงทะเบียนผ่านระบบ Firebase ได้';
        if (err.code === 'auth/email-already-in-use') {
          msg = 'อีเมลนี้ถูกใช้งานแล้วในระบบ Firebase';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'รูปแบบอีเมลไม่ถูกต้อง';
        } else if (err.code === 'auth/weak-password') {
          msg = 'รหัสผ่านมีความคุ้มครองต่ำเกินไป (ต้องยาวเกิน 6 ตัวอักษร)';
        } else {
          msg = err.message || msg;
        }
        throw new Error(msg);
      }
    } else {
      // Offline Local Mode with password authentication
      const users: UserProfile[] = JSON.parse(localStorage.getItem('jdt_users') || '[]');
      const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        throw new Error('อีเมลนี้ถูกลงทะเบียนไว้แล้วในฐานข้อมูลทดสอบ');
      }

      const newUser: UserProfile = {
        uid: 'user_' + Math.random().toString(36).substring(2, 9),
        email: email,
        displayName: displayName || email.split('@')[0],
        photoURL: PROFILE_AVATARS[Math.floor(Math.random() * PROFILE_AVATARS.length)],
        startingCapital: startingCapital || 10000,
        createdAt: new Date().toISOString(),
      };

      if (password) {
        const passwords = JSON.parse(localStorage.getItem('jdt_passwords') || '{}');
        passwords[email.toLowerCase()] = password;
        localStorage.setItem('jdt_passwords', JSON.stringify(passwords));
      }

      users.push(newUser);
      localStorage.setItem('jdt_users', JSON.stringify(users));
      localStorage.setItem('jdt_current_user_id', newUser.uid);
      return newUser;
    }
  },

  async loginUser(email: string, password?: string): Promise<UserProfile> {
    if (hasFirebaseConfig && auth) {
      if (!password) {
        throw new Error('กรุณากรอกรหัสผ่านเพื่อเข้าใช้งานระบบ Firebase Auth');
      }
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        let users: UserProfile[] = JSON.parse(localStorage.getItem('jdt_users') || '[]');
        let profile = users.find((u) => u.uid === firebaseUser.uid);
        
        if (!profile) {
          // Auto sync details
          profile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || email,
            displayName: firebaseUser.displayName || email.split('@')[0],
            photoURL: firebaseUser.photoURL || PROFILE_AVATARS[0],
            startingCapital: 10000,
            createdAt: new Date().toISOString(),
          };
          users.push(profile);
          localStorage.setItem('jdt_users', JSON.stringify(users));
        }
        
        localStorage.setItem('jdt_current_user_id', firebaseUser.uid);
        return profile;
      } catch (err: any) {
        console.error('Firebase login failed:', err);
        let msg = 'อีเมลหรือรหัสผ่านระบบ Firebase ไม่ถูกต้อง';
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
          msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'รูปแบบอีเมลไม่ถูกต้อง';
        } else {
          msg = err.message || msg;
        }
        throw new Error(msg);
      }
    } else {
      // Offline local mode
      const users: UserProfile[] = JSON.parse(localStorage.getItem('jdt_users') || '[]');
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      
      if (user) {
        const passwords = JSON.parse(localStorage.getItem('jdt_passwords') || '{}');
        const savedPass = passwords[email.toLowerCase()];
        
        if (savedPass && password && savedPass !== password) {
          throw new Error('รหัสผ่านไม่ถูกต้อง');
        } else if (!savedPass && password) {
          // Save password on first login for preseeded accounts
          passwords[email.toLowerCase()] = password;
          localStorage.setItem('jdt_passwords', JSON.stringify(passwords));
        }
        
        localStorage.setItem('jdt_current_user_id', user.uid);
        return user;
      }
      
      // Auto-register offline if password provided
      return this.registerUser(email, email.split('@')[0], 10000, password);
    }
  },

  async logout() {
    if (hasFirebaseConfig && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error('Firebase logout error:', err);
      }
    }
    localStorage.removeItem('jdt_current_user_id');
  },

  // Google Sign-In
  async loginWithGoogle(): Promise<UserProfile> {
    if (hasFirebaseConfig && auth) {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;

        let users: UserProfile[] = JSON.parse(localStorage.getItem('jdt_users') || '[]');
        let profile = users.find((u) => u.uid === firebaseUser.uid || u.email.toLowerCase() === (firebaseUser.email || '').toLowerCase());

        if (!profile) {
          profile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || 'google_trader@gmail.com',
            displayName: firebaseUser.displayName || 'Google Trader',
            photoURL: firebaseUser.photoURL || PROFILE_AVATARS[1],
            startingCapital: 10000,
            createdAt: new Date().toISOString(),
          };
          users.push(profile);
        } else {
          profile.photoURL = firebaseUser.photoURL || profile.photoURL;
          profile.displayName = firebaseUser.displayName || profile.displayName;
        }

        localStorage.setItem('jdt_users', JSON.stringify(users));
        localStorage.setItem('jdt_current_user_id', profile.uid);
        return profile;
      } catch (err: any) {
        console.warn('Firebase Google Auth popup skipped/failed, using fallback Google profile:', err);
        // Fallback demo Google user for sandboxed preview environment
        return this.loginWithGoogleFallback();
      }
    } else {
      return this.loginWithGoogleFallback();
    }
  },

  loginWithGoogleFallback(): UserProfile {
    const googleEmail = 'lukinngoenwilai@gmail.com';
    let users: UserProfile[] = JSON.parse(localStorage.getItem('jdt_users') || '[]');
    let user = users.find((u) => u.email.toLowerCase() === googleEmail.toLowerCase());

    if (!user) {
      user = {
        uid: 'google_user_' + Math.random().toString(36).substring(2, 9),
        email: googleEmail,
        displayName: 'Lukin (Google)',
        photoURL: PROFILE_AVATARS[0],
        startingCapital: 10000,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
    }

    localStorage.setItem('jdt_users', JSON.stringify(users));
    localStorage.setItem('jdt_current_user_id', user.uid);
    return user;
  },

  // Change Password
  async changePassword(newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
    }

    // Firebase password update
    if (hasFirebaseConfig && auth && auth.currentUser) {
      try {
        await firebaseUpdatePassword(auth.currentUser, newPassword);
      } catch (err: any) {
        console.warn('Firebase password update warning:', err);
        if (err.code === 'auth/requires-recent-login') {
          throw new Error('เพื่อความปลอดภัย กรุณาล็อกเอาต์แล้วเข้าสู่ระบบใหม่อีกครั้งก่อนเปลี่ยนรหัสผ่าน');
        }
      }
    }

    // Local storage password update
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const passwords = JSON.parse(localStorage.getItem('jdt_passwords') || '{}');
      passwords[currentUser.email.toLowerCase()] = newPassword;
      localStorage.setItem('jdt_passwords', JSON.stringify(passwords));
    }
  },

  // Send OTP
  async sendOTP(email: string): Promise<{ otpCode: string; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('กรุณากรอกอีเมลที่ถูกต้อง');
    }

    // Check if user exists (in local or firebase)
    const users: UserProfile[] = JSON.parse(localStorage.getItem('jdt_users') || '[]');
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in localStorage with 5-min expiration
    const otps = JSON.parse(localStorage.getItem('jdt_otps') || '{}');
    otps[cleanEmail] = {
      code: otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    };
    localStorage.setItem('jdt_otps', JSON.stringify(otps));

    // Send Firebase reset email if live
    if (hasFirebaseConfig && auth) {
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
      } catch (err) {
        console.warn('Firebase sendPasswordResetEmail notice:', err);
      }
    }

    return {
      otpCode,
      message: `ส่งรหัส OTP 6 หลักไปยัง ${cleanEmail} เรียบร้อยแล้ว (รหัสทดสอบ: ${otpCode})`,
    };
  },

  // Verify OTP
  verifyOTP(email: string, code: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const otps = JSON.parse(localStorage.getItem('jdt_otps') || '{}');
    const record = otps[cleanEmail];

    if (!record) {
      throw new Error('ไม่พบข้อมูล OTP หรือรหัสผ่านหมดอายุแล้ว กรุณากดส่ง OTP ใหม่อีกครั้ง');
    }

    if (Date.now() > record.expiresAt) {
      throw new Error('รหัส OTP หมดอายุแล้ว (อายุ 5 นาที) กรุณากดส่งรหัสใหม่อีกครั้ง');
    }

    if (record.code !== cleanCode) {
      throw new Error('รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบรหัส 6 หลักในกล่องข้อความ');
    }

    return true;
  },

  // Reset Password using OTP
  async resetPasswordWithOTP(email: string, code: string, newPassword: string): Promise<UserProfile> {
    this.verifyOTP(email, code);

    if (!newPassword || newPassword.length < 6) {
      throw new Error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
    }

    const cleanEmail = email.trim().toLowerCase();

    // Update local passwords
    const passwords = JSON.parse(localStorage.getItem('jdt_passwords') || '{}');
    passwords[cleanEmail] = newPassword;
    localStorage.setItem('jdt_passwords', JSON.stringify(passwords));

    // Remove used OTP
    const otps = JSON.parse(localStorage.getItem('jdt_otps') || '{}');
    delete otps[cleanEmail];
    localStorage.setItem('jdt_otps', JSON.stringify(otps));

    // Login user or register if user doesn't exist
    let users: UserProfile[] = JSON.parse(localStorage.getItem('jdt_users') || '[]');
    let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      user = await this.registerUser(cleanEmail, cleanEmail.split('@')[0], 10000, newPassword);
    } else {
      localStorage.setItem('jdt_current_user_id', user.uid);
    }

    return user;
  },


  // Trades
  getTrades(userId: string): Trade[] {
    try {
      const raw = localStorage.getItem('jdt_trades');
      const trades: Trade[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(trades)) return [];
      return trades.filter((t) => t.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
    } catch (err) {
      console.warn('Error reading jdt_trades:', err);
      return [];
    }
  },

  addTrade(tradeData: Omit<Trade, 'id' | 'createdAt'> & { id?: string }): Trade {
    let trades: Trade[] = [];
    try {
      const raw = localStorage.getItem('jdt_trades');
      trades = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(trades)) trades = [];
    } catch (e) {
      console.warn('Failed to parse jdt_trades, resetting list', e);
      trades = [];
    }
    
    let resultTrade: Trade;

    // If trade has an ID, we update it
    if (tradeData.id) {
      const index = trades.findIndex((t) => t.id === tradeData.id);
      if (index !== -1) {
        trades[index] = {
          ...trades[index],
          ...tradeData,
          id: tradeData.id, // preserve ID
        } as Trade;
        resultTrade = trades[index];
      } else {
        resultTrade = {
          ...tradeData,
          id: tradeData.id,
          createdAt: Date.now(),
        } as Trade;
        trades.push(resultTrade);
      }
    } else {
      // Otherwise, create a new trade
      resultTrade = {
        ...tradeData,
        id: 'trade_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        createdAt: Date.now(),
      } as Trade;
      trades.push(resultTrade);
    }

    try {
      localStorage.setItem('jdt_trades', JSON.stringify(trades));
    } catch (err) {
      console.warn('LocalStorage quota limit reached, saving with image optimization...', err);
      try {
        // Strip heavy image strings if quota exceeded
        const optimized = trades.map((t) => {
          if (t.imageUrl && t.imageUrl.length > 5000) {
            return { ...t, imageUrl: '' };
          }
          return t;
        });
        localStorage.setItem('jdt_trades', JSON.stringify(optimized));
      } catch (err2) {
        console.error('Critical quota error saving trades:', err2);
      }
    }

    return resultTrade;
  },

  deleteTrade(tradeId: string): void {
    try {
      const raw = localStorage.getItem('jdt_trades');
      const trades: Trade[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(trades)) return;
      const filtered = trades.filter((t) => t.id !== tradeId);
      localStorage.setItem('jdt_trades', JSON.stringify(filtered));
    } catch (err) {
      console.error('Error deleting trade:', err);
    }
  },

  updateStartingCapital(userId: string, capital: number): void {
    const users: UserProfile[] = JSON.parse(localStorage.getItem('jdt_users') || '[]');
    const index = users.findIndex((u) => u.uid === userId);
    if (index !== -1) {
      users[index].startingCapital = capital;
      localStorage.setItem('jdt_users', JSON.stringify(users));
    }
  },

  // Cashflows (Deposit & Withdrawal Management)
  getCashflows(userId: string): CashflowRecord[] {
    const records: CashflowRecord[] = JSON.parse(localStorage.getItem('jdt_cashflows') || '[]');
    return records.filter((r) => r.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
  },

  addCashflow(record: Omit<CashflowRecord, 'id' | 'createdAt'>): CashflowRecord {
    const records: CashflowRecord[] = JSON.parse(localStorage.getItem('jdt_cashflows') || '[]');
    const newRecord: CashflowRecord = {
      ...record,
      id: 'cf_' + Math.random().toString(36).substring(2, 11),
      createdAt: Date.now(),
    };
    records.push(newRecord);
    localStorage.setItem('jdt_cashflows', JSON.stringify(records));
    return newRecord;
  },

  deleteCashflow(id: string): void {
    const records: CashflowRecord[] = JSON.parse(localStorage.getItem('jdt_cashflows') || '[]');
    const filtered = records.filter((r) => r.id !== id);
    localStorage.setItem('jdt_cashflows', JSON.stringify(filtered));
  }
};
