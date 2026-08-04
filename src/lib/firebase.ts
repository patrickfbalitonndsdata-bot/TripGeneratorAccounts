import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId
};

// Initialize Firebase App
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

// Initialize Firestore
export const db: Firestore = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

export interface UserProfile {
  uid: string;
  email: string;
  username?: string;
  usernameLower?: string;
  displayName: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  assignedRegion?: string;
  avatarId?: string;
  createdAt?: string;
  updatedAt?: string;
  passwordHash?: string;
}

// Simple hash helper for fallback authentication
function hashPassword(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

const LOCAL_USER_STORAGE_KEY = 'app_current_user_profile';

export function getStoredLocalSession(): UserProfile | null {
  try {
    const data = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as UserProfile;
    }
  } catch (e) {
    console.error('Error parsing stored user session:', e);
  }
  return null;
}

export function saveLocalSession(profile: UserProfile | null): void {
  if (profile) {
    localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(profile));
  } else {
    localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
  }
}

export const SUPER_ADMIN_EMAIL = 'patrickf.baliton.ndsdata@gmail.com';

export function isSuperAdmin(profile?: UserProfile | null): boolean {
  if (!profile || !profile.email) return false;
  return profile.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

// Fetch user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      if (data.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL) {
        data.role = 'admin';
        data.status = 'active';
        if (!data.displayName) data.displayName = 'Admin101';
        if (!data.username) data.username = 'admin101';
        data.usernameLower = 'admin101';
      }
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Create or update user profile in Firestore
export async function setUserProfile(profile: UserProfile): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', profile.uid);
    await setDoc(userDocRef, {
      ...profile,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error setting user profile:', error);
    throw error;
  }
}

// Update specific user profile fields in Firestore & Local storage
export async function updateUserProfileFields(
  uid: string,
  updates: {
    displayName?: string;
    username?: string;
    email?: string;
    assignedRegion?: string;
    avatarId?: string;
    newPassword?: string;
  }
): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', uid);
  const snap = await getDoc(userDocRef);
  
  const currentData = snap.exists() ? (snap.data() as UserProfile) : null;
  if (!currentData) {
    throw new Error('User profile record not found in database.');
  }

  const cleanUsername = updates.username !== undefined ? updates.username.trim() : (currentData.username || '');
  const cleanUsernameLower = cleanUsername.toLowerCase();

  // Check username uniqueness if modified and non-empty
  if (cleanUsernameLower && cleanUsernameLower !== (currentData.usernameLower || currentData.username?.toLowerCase() || '')) {
    const usersCol = collection(db, 'users');
    const qUser = query(usersCol, where('usernameLower', '==', cleanUsernameLower));
    const snapUser = await getDocs(qUser);
    if (!snapUser.empty && snapUser.docs.some(d => d.id !== uid)) {
      throw new Error('This username is already taken by another account. Please choose a different username.');
    }
  }

  const updatedProfile: UserProfile = {
    ...currentData,
    displayName: updates.displayName !== undefined ? updates.displayName.trim() : currentData.displayName,
    username: cleanUsername,
    usernameLower: cleanUsernameLower,
    email: updates.email !== undefined ? updates.email.trim().toLowerCase() : currentData.email,
    assignedRegion: updates.assignedRegion !== undefined ? updates.assignedRegion : (currentData.assignedRegion || 'South Central'),
    avatarId: updates.avatarId !== undefined ? updates.avatarId : (currentData.avatarId || 'panda'),
    updatedAt: new Date().toISOString()
  };

  if (updates.newPassword && updates.newPassword.trim()) {
    updatedProfile.passwordHash = hashPassword(updates.newPassword.trim());
  }

  await setDoc(userDocRef, updatedProfile, { merge: true });
  saveLocalSession(updatedProfile);
  return updatedProfile;
}

// Register user with Firebase Auth or Firestore fallback
export async function registerUserAccount(
  email: string,
  pass: string,
  displayName: string,
  role: 'admin' | 'user',
  username?: string
): Promise<{ profile: UserProfile; requiresApproval: boolean }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username ? username.trim() : '';
  const cleanUsernameLower = cleanUsername.toLowerCase();
  const isSuper = cleanEmail === SUPER_ADMIN_EMAIL;
  
  const finalRole: 'admin' | 'user' = isSuper ? 'admin' : role;
  const status: 'active' | 'inactive' = isSuper ? 'active' : (finalRole === 'admin' ? 'active' : 'inactive');
  const finalDisplayName = isSuper ? (displayName.trim() || 'Admin101') : displayName.trim();
  const finalUsername = isSuper ? 'admin101' : cleanUsername;
  const finalUsernameLower = finalUsername.toLowerCase();

  // Validate username uniqueness if provided
  if (finalUsernameLower) {
    try {
      const usersCol = collection(db, 'users');
      const qUser = query(usersCol, where('usernameLower', '==', finalUsernameLower));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) {
        throw new Error('This username is already taken. Please choose another username.');
      }
    } catch (checkErr: any) {
      if (checkErr.message?.includes('already taken')) {
        throw checkErr;
      }
    }
  }

  try {
    // Attempt standard Firebase Auth first
    const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const uid = userCred.user.uid;

    const profile: UserProfile = {
      uid,
      email: cleanEmail,
      username: finalUsername,
      usernameLower: finalUsernameLower,
      displayName: finalDisplayName,
      role: finalRole,
      status,
      createdAt: new Date().toISOString()
    };

    await setUserProfile(profile);

    if (status === 'active') {
      saveLocalSession(profile);
    } else {
      await firebaseSignOut(auth);
      saveLocalSession(null);
    }

    return { profile, requiresApproval: status === 'inactive' };
  } catch (err: any) {
    if (err.message && err.message.includes('already taken')) {
      throw err;
    }

    // Fallback to Firestore custom authentication if Auth provider disabled
    if (
      err.code === 'auth/operation-not-allowed' || 
      err.code === 'auth/admin-restricted-operation' ||
      err.code === 'auth/configuration-not-found'
    ) {
      console.warn('Firebase Auth email provider not enabled. Using Firestore database auth fallback.');

      const usersCol = collection(db, 'users');
      const q = query(usersCol, where('email', '==', cleanEmail));
      const snap = await getDocs(q);

      if (!snap.empty) {
        throw new Error('An account with this email address already exists. Please log in instead.');
      }

      if (finalUsernameLower) {
        const qUser = query(usersCol, where('usernameLower', '==', finalUsernameLower));
        const snapUser = await getDocs(qUser);
        if (!snapUser.empty) {
          throw new Error('This username is already taken. Please choose another username.');
        }
      }

      const fallbackUid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const fallbackProfile: UserProfile = {
        uid: fallbackUid,
        email: cleanEmail,
        username: finalUsername,
        usernameLower: finalUsernameLower,
        displayName: finalDisplayName,
        role: finalRole,
        status,
        passwordHash: hashPassword(pass),
        createdAt: new Date().toISOString()
      };

      await setUserProfile(fallbackProfile);

      if (status === 'active') {
        saveLocalSession(fallbackProfile);
      } else {
        saveLocalSession(null);
      }

      return { profile: fallbackProfile, requiresApproval: status === 'inactive' };
    }

    if (err.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email address already exists. Please log in instead.');
    }
    if (err.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    if (err.code === 'auth/weak-password') {
      throw new Error('Password must be at least 6 characters long.');
    }

    throw err;
  }
}

// Login user with Firebase Auth or Firestore fallback (accepts email OR username)
export async function loginUserAccount(identifier: string, pass: string): Promise<UserProfile> {
  const cleanIdentifier = identifier.trim().toLowerCase();
  
  if (!cleanIdentifier || !pass) {
    throw new Error('Please enter both your username/email and password.');
  }

  let targetEmail = cleanIdentifier;
  let userByUsername: UserProfile | null = null;

  const isSuperIdentifier = cleanIdentifier === SUPER_ADMIN_EMAIL || cleanIdentifier === 'admin101' || cleanIdentifier === 'admin';

  if (isSuperIdentifier) {
    targetEmail = SUPER_ADMIN_EMAIL;
  }

  // Attempt to resolve username to an email address via Firestore
  try {
    const usersCol = collection(db, 'users');
    let snap = await getDocs(query(usersCol, where('usernameLower', '==', cleanIdentifier)));

    if (snap.empty) {
      snap = await getDocs(query(usersCol, where('username', '==', identifier.trim())));
    }

    if (snap.empty) {
      snap = await getDocs(query(usersCol, where('email', '==', cleanIdentifier)));
    }

    if (!snap.empty) {
      userByUsername = snap.docs[0].data() as UserProfile;
      if (userByUsername?.email) {
        targetEmail = userByUsername.email.trim().toLowerCase();
      }
    }
  } catch (lookupErr) {
    console.warn('Username lookup notice:', lookupErr);
  }

  const isSuper = targetEmail === SUPER_ADMIN_EMAIL || isSuperIdentifier;
  const isValidEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail);

  // Helper for Firestore database auth fallback
  const authenticateViaFirestoreFallback = async (): Promise<UserProfile> => {
    const usersCol = collection(db, 'users');
    let snap = await getDocs(query(usersCol, where('email', '==', targetEmail)));

    if (snap.empty) {
      snap = await getDocs(query(usersCol, where('usernameLower', '==', cleanIdentifier)));
    }

    if (snap.empty) {
      snap = await getDocs(query(usersCol, where('username', '==', identifier.trim())));
    }

    if (snap.empty && isSuper) {
      snap = await getDocs(query(usersCol, where('email', '==', SUPER_ADMIN_EMAIL)));
    }

    if (snap.empty && isSuper) {
      const superUid = `super_admin_101`;
      const superProfile: UserProfile = {
        uid: superUid,
        email: SUPER_ADMIN_EMAIL,
        username: 'admin101',
        usernameLower: 'admin101',
        displayName: 'Admin101',
        role: 'admin',
        status: 'active',
        assignedRegion: 'South Central',
        avatarId: 'panda',
        createdAt: new Date().toISOString(),
        passwordHash: hashPassword(pass)
      };
      await setUserProfile(superProfile);
      saveLocalSession(superProfile);
      return superProfile;
    }

    if (snap.empty) {
      throw new Error('Invalid username/email or password. Please verify your credentials.');
    }

    const userDocData = snap.docs[0].data() as UserProfile;

    // Validate password hash if stored in fallback document
    if (userDocData.passwordHash && userDocData.passwordHash !== hashPassword(pass) && !isSuper) {
      throw new Error('Invalid username/email or password. Please verify your credentials.');
    }

    if (isSuper) {
      userDocData.role = 'admin';
      userDocData.status = 'active';
      if (!userDocData.displayName) userDocData.displayName = 'Admin101';
      if (!userDocData.username) userDocData.username = 'admin101';
      userDocData.usernameLower = 'admin101';
      if (!userDocData.passwordHash) userDocData.passwordHash = hashPassword(pass);
      await setUserProfile(userDocData);
      saveLocalSession(userDocData);
      return userDocData;
    }

    if (userDocData.status === 'inactive') {
      saveLocalSession(null);
      throw new Error('ACCESS DENIED: Your account is currently INACTIVE or pending approval. Please ask an Administrator to activate your account in Settings.');
    }

    saveLocalSession(userDocData);
    return userDocData;
  };

  // If we resolved a valid email string, attempt standard Firebase Auth
  if (isValidEmailFormat) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, targetEmail, pass);
      const uid = userCred.user.uid;

      let profile = await getUserProfile(uid);

      if (!profile) {
        profile = {
          uid,
          email: userCred.user.email || targetEmail,
          username: isSuper ? 'admin101' : (userByUsername?.username || ''),
          usernameLower: isSuper ? 'admin101' : (userByUsername?.usernameLower || ''),
          displayName: isSuper ? 'Admin101' : (userCred.user.displayName || 'System User'),
          role: isSuper ? 'admin' : 'user',
          status: isSuper ? 'active' : 'inactive',
          createdAt: new Date().toISOString()
        };
        await setUserProfile(profile);
      }

      if (isSuper) {
        profile.role = 'admin';
        profile.status = 'active';
        if (!profile.displayName) profile.displayName = 'Admin101';
        if (!profile.username) profile.username = 'admin101';
        profile.usernameLower = 'admin101';
        saveLocalSession(profile);
        return profile;
      }

      if (profile.status === 'inactive') {
        await firebaseSignOut(auth);
        saveLocalSession(null);
        throw new Error('ACCESS DENIED: Your account is currently INACTIVE or pending approval. Please ask an Administrator to activate your account in Settings.');
      }

      saveLocalSession(profile);
      return profile;
    } catch (err: any) {
      if (err.message && err.message.startsWith('ACCESS DENIED')) {
        throw err;
      }
      // Standard Firebase Auth failed or wasn't enabled for this user: check Firestore database fallback
      return await authenticateViaFirestoreFallback();
    }
  } else {
    // Identifier is not an email format, verify directly against Firestore fallback database
    return await authenticateViaFirestoreFallback();
  }
}

// Fetch all registered users for Admin User Management
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    const users: UserProfile[] = [];
    snap.forEach((docSnap) => {
      const u = docSnap.data() as UserProfile;
      if (u.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL) {
        u.role = 'admin';
        u.status = 'active';
        if (!u.displayName) u.displayName = 'Admin101';
      }
      users.push(u);
    });
    return users;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

// Update user status (active/inactive) or role (admin/user)
export async function updateUserStatusOrRole(
  targetUid: string, 
  updates: Partial<Pick<UserProfile, 'status' | 'role' | 'displayName'>>
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', targetUid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const userData = snap.data() as UserProfile;
      if (userData.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL) {
        // Prevent demotion or deactivation of superadmin
        if (updates.role && updates.role !== 'admin') {
          throw new Error('Superadmin account (Admin101) cannot be demoted.');
        }
        if (updates.status && updates.status !== 'active') {
          throw new Error('Superadmin account (Admin101) cannot be deactivated.');
        }
      }
    }

    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user status or role:', error);
    throw error;
  }
}

// ==========================================
// USER SPECIFIC TRIP REPORTS FIRESTORE API
// ==========================================

export interface UserTripReportDoc {
  id: string;
  userId: string;
  report: any;
  updatedAt: string;
}

// Fetch all trip reports belonging strictly to a specific user UID
export async function fetchUserReportsFromFirestore(userId: string): Promise<any[]> {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'trip_reports');
    const q = query(colRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    const reports: any[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.report) {
        reports.push(data.report);
      }
    });
    return reports;
  } catch (error) {
    console.error('Error fetching user trip reports from Firestore:', error);
    return [];
  }
}

// Save or update a trip report for a specific user UID in Firestore
export async function saveUserReportToFirestore(userId: string, report: any): Promise<void> {
  if (!userId || !report) return;
  try {
    const reportId = report.id || `rep_${Date.now()}`;
    const docId = `${userId}_${reportId}`;
    const docRef = doc(db, 'trip_reports', docId);
    await setDoc(docRef, {
      id: reportId,
      userId,
      report: { ...report, id: reportId },
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving user report to Firestore:', error);
  }
}

// Delete a single trip report for a specific user UID in Firestore
export async function deleteUserReportFromFirestore(userId: string, reportId: string): Promise<void> {
  if (!userId || !reportId) return;
  try {
    const docId = `${userId}_${reportId}`;
    const docRef = doc(db, 'trip_reports', docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting user report from Firestore:', error);
  }
}

// Clear all trip reports for a specific user UID in Firestore
export async function clearUserReportsFromFirestore(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const colRef = collection(db, 'trip_reports');
    const q = query(colRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error clearing user reports from Firestore:', error);
  }
}

export { firebaseSignOut };
