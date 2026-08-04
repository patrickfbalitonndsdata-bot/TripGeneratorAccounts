import React, { useState } from 'react';
import { UserProfile, updateUserProfileFields } from '../lib/firebase';
import { CUTE_AVATARS, getAvatarById, AvatarOption } from '../utils/avatars';
import { SettingsConfig } from '../types';
import { 
  User, 
  Mail, 
  Lock, 
  MapPin, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  Save, 
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Smile,
  X,
  Crown
} from 'lucide-react';

interface UserProfileViewProps {
  currentUserProfile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
  settings: SettingsConfig;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUserProfile,
  onProfileUpdated,
  settings
}) => {
  const [displayName, setDisplayName] = useState(currentUserProfile.displayName || '');
  const [username, setUsername] = useState(currentUserProfile.username || '');
  const [email, setEmail] = useState(currentUserProfile.email || '');
  const [assignedRegion, setAssignedRegion] = useState(
    currentUserProfile.assignedRegion || settings.regions[0] || 'South Central'
  );
  const [selectedAvatarId, setSelectedAvatarId] = useState(currentUserProfile.avatarId || 'panda');
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentAvatar = getAvatarById(selectedAvatarId);
  const isSuperAdmin = currentUserProfile.email?.toLowerCase() === 'patrickf.baliton.ndsdata@gmail.com';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!displayName.trim()) {
      setErrorMsg('Display Name cannot be empty.');
      return;
    }

    if (!username.trim()) {
      setErrorMsg('Username cannot be empty.');
      return;
    }

    if (username.trim().length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
      setErrorMsg('Username can only contain letters, numbers, underscores, dots, and hyphens.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New passwords do not match. Please verify your entries.');
        return;
      }
    }

    setSaving(true);

    try {
      const updated = await updateUserProfileFields(currentUserProfile.uid, {
        displayName: displayName.trim(),
        username: username.trim(),
        email: email.trim(),
        assignedRegion,
        avatarId: selectedAvatarId,
        newPassword: newPassword.trim() ? newPassword.trim() : undefined
      });

      onProfileUpdated(updated);
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('Your profile and preferences have been successfully saved!');

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setErrorMsg(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/80 p-6 sm:p-8 rounded-3xl border border-amber-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          {/* Avatar Display with Edit Button */}
          <div className="relative group">
            <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br ${currentAvatar.bgGradient} flex items-center justify-center text-4xl sm:text-5xl shadow-2xl border-2 ${currentAvatar.borderColor} transition-transform group-hover:scale-105`}>
              <span>{currentAvatar.emoji}</span>
            </div>
            
            {/* Change Avatar Button */}
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="absolute -bottom-2 -right-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1.5 rounded-xl text-xs font-extrabold shadow-lg flex items-center gap-1.5 border border-amber-300 transition-all cursor-pointer hover:scale-105"
              title="Choose Profile Avatar"
            >
              <Smile className="w-4 h-4" />
              <span>Avatar</span>
            </button>
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {displayName || 'User Profile'}
              </h1>
              {isSuperAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider border bg-amber-500 text-slate-950 border-amber-300 shadow-sm flex items-center gap-1">
                  <Crown className="w-3 h-3 fill-slate-950" />
                  <span>SUPERADMIN</span>
                </span>
              ) : (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  currentUserProfile.role === 'admin' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {currentUserProfile.role}
                </span>
              )}
            </div>

            <p className="text-sm text-slate-300 font-medium flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>{email}</span>
              </span>
              {username && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
                  @{username}
                </span>
              )}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-400">
              <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Region: <strong className="text-amber-300 font-semibold">{assignedRegion}</strong></span>
              </span>
              <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Account Status: <strong className="text-emerald-400 capitalize font-semibold">{currentUserProfile.status}</strong></span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-md">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Personal Information Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-500" />
              <span>Personal Details & Region</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Update your display name, username, login email, and assigned operating region</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Full Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Matthew Poche"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Account Username
              </label>
              <div className="relative">
                <span className="text-slate-400 absolute left-3.5 top-2.5 font-bold text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., matthew_p"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none font-mono"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Pick Assigned Region */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Assigned Region
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <select
                  value={assignedRegion}
                  onChange={(e) => setAssignedRegion(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none cursor-pointer"
                >
                  {settings.regions.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Account Role & Status (Readonly indicator) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Account Privilege & Status
              </label>
              <div className="flex items-center space-x-3 px-4 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                <span className="capitalize">{isSuperAdmin ? 'Superadmin' : `${currentUserProfile.role} Account`}</span>
                <span>•</span>
                <span className="text-emerald-600 capitalize">{currentUserProfile.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>Change Security Password</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Leave blank if you do not want to update your current account password</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters (optional)"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* AVATAR SELECTOR MODAL */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white max-w-2xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Smile className="w-6 h-6 text-amber-500" />
                  <span>Choose Profile Avatar</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Select a cute icon avatar to represent your account</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CUTE_AVATARS.map((avatar: AvatarOption) => {
                const isSelected = selectedAvatarId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatarId(avatar.id);
                      setShowAvatarModal(false);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-400/30 scale-105'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center text-3xl shadow-sm border ${avatar.borderColor}`}>
                      <span>{avatar.emoji}</span>
                    </div>
                    <span className={`text-xs font-bold mt-2 text-center line-clamp-1 ${
                      isSelected ? 'text-amber-900' : 'text-slate-700 group-hover:text-slate-900'
                    }`}>
                      {avatar.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

