import React, { useState, useRef } from 'react';
import { 
  User, 
  Wallet, 
  Layers, 
  ShieldCheck, 
  Bell, 
  Key, 
  Check, 
  Copy, 
  ExternalLink,
  Save,
  Moon,
  Sun,
  Camera,
  Trash2,
  Lock,
  Phone,
  AlertTriangle,
  X,
  RefreshCw,
  Upload
} from 'lucide-react';
import { UserProfile } from '../types';
import { copyToClipboard } from '../utils/crypto';

interface SettingsViewProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onSetDarkMode?: (isDark: boolean) => void;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  user, 
  onUpdateUser,
  isDarkMode = false,
  onToggleDarkMode = () => {},
  onSetDarkMode,
  onLogout
}) => {
  // Profile edit fields
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username || 'alexvance');
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '+1 (555) 234-5678');
  const [organization, setOrganization] = useState(user.organization || 'Apex Studio Labs');
  const [avatar, setAvatar] = useState(user.avatar);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Blockchain config
  const [wallet, setWallet] = useState(user.walletAddress);
  const [network, setNetwork] = useState(user.network);
  
  // Notification and privacy settings
  const [autoTimestamp, setAutoTimestamp] = useState(true);
  const [tamperAlerts, setTamperAlerts] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [publicLedgerVisibility, setPublicLedgerVisibility] = useState(true);

  // Status feedback
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete profile picture confirmation dialog
  const [showDeletePhotoConfirm, setShowDeletePhotoConfirm] = useState(false);

  // Account Deactivation dialog
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const defaultPlaceholderAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

  // Handle avatar upload / update
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
          onUpdateUser({ avatar: reader.result });
          setProfileMessage('Profile picture updated successfully!');
          setTimeout(() => setProfileMessage(null), 3000);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Delete profile picture
  const handleDeleteAvatar = () => {
    setAvatar(defaultPlaceholderAvatar);
    onUpdateUser({ avatar: defaultPlaceholderAvatar });
    setShowDeletePhotoConfirm(false);
    setProfileMessage('Profile picture removed (reverted to default placeholder).');
    setTimeout(() => setProfileMessage(null), 3000);
  };

  // Validation functions
  const validateName = (val: string) => {
    if (!val || typeof val !== 'string') return false;
    const trimmed = val.trim();
    if (trimmed.length < 2) return false;
    const nameRegex = /^[a-zA-Z\s\-\'\.]{2,}$/;
    return nameRegex.test(trimmed) && /[a-zA-Z]/.test(trimmed);
  };

  const validateEmail = (val: string) => {
    if (!val || typeof val !== 'string') return false;
    const trimmed = val.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) return false;
    const parts = trimmed.split('@');
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!local || local.startsWith('.') || local.endsWith('.')) return false;
    if (!domain || domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) return false;
    const domainParts = domain.split('.');
    if (domainParts.length < 2) return false;
    const tld = domainParts[domainParts.length - 1];
    return /^[a-zA-Z]{2,}$/.test(tld);
  };

  const validatePhone = (val: string) => {
    if (!val || val.trim() === '') return true; // Optional field
    const trimmed = val.trim();
    if (trimmed.startsWith('-')) return false;
    const e164Regex = /^\+[1-9]\d{7,14}$/;
    const usRegex = /^(\([0-9]{3}\)\s*|[0-9]{3}[-.\s])[0-9]{3}[-.\s][0-9]{4}$/;
    const digitsRegex = /^\d{10,15}$/;
    return e164Regex.test(trimmed) || usRegex.test(trimmed) || digitsRegex.test(trimmed);
  };

  const validateUsername = (val: string) => {
    if (!val || typeof val !== 'string') return false;
    const trimmed = val.trim();
    if (trimmed.length < 3) return false;
    return /^[a-zA-Z0-9_-]{3,}$/.test(trimmed);
  };

  // Save profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    // 1. Full Name / Creator Pseudonym Validation
    if (!validateName(name)) {
      setProfileError("Please enter a valid name (letters, spaces, hyphens, apostrophes only, min 2 characters).");
      return;
    }

    // 2. Email Address Validation
    if (!validateEmail(email)) {
      setProfileError("Please enter a valid email address (e.g., user@domain.com).");
      return;
    }

    // 3. Phone Number Validation
    if (!validatePhone(phone)) {
      setProfileError("Please enter a valid phone number (e.g., +1234567890 or (123) 456-7890).");
      return;
    }

    // 4. Username / Handle Validation
    if (!validateUsername(username)) {
      setProfileError("Username must be at least 3 characters (letters, numbers, underscores, hyphens only).");
      return;
    }

    onUpdateUser({
      name: name.trim(),
      username: username.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      organization: organization ? organization.trim() : '',
      avatar,
      walletAddress: wallet,
      network
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Change Password handler
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    // Success simulation
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setTimeout(() => setPasswordSuccess(false), 3500);
  };

  // Copy wallet address
  const handleCopyWallet = async () => {
    await copyToClipboard(wallet);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  // Execute account deactivation
  const handleDeactivateAccount = () => {
    setIsDeactivating(true);
    setTimeout(() => {
      setIsDeactivating(false);
      setShowDeactivateModal(false);
      if (onLogout) {
        onLogout();
      }
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wider mb-1">
            <User className="w-4 h-4" />
            <span>Account & Profile Settings</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Profile & Settings
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Manage your creator profile, contact details, authentication credentials, and blockchain configuration.
          </p>
        </div>

        <a
          id="public-profile-link"
          href="/profile.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-300 border border-violet-500/30 text-xs font-semibold transition self-start sm:self-auto"
        >
          <span>View Profile Page (HTML)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Success Banner */}
      {profileMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{profileMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setProfileMessage(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:underline text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* APPEARANCE & THEME CARD */}
      <div 
        id="appearance-settings-card"
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6 transition-colors duration-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              {isDarkMode ? (
                <Moon className="w-4 h-4 text-violet-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Interface Appearance & Theme
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Switch the system theme between Daylight Light Mode and Obsidian Dark Mode.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </span>
            <button
              type="button"
              id="dark-mode-toggle"
              role="switch"
              aria-checked={isDarkMode}
              onClick={onToggleDarkMode}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                isDarkMode ? 'bg-violet-600' : 'bg-slate-200'
              }`}
            >
              <span className="sr-only">Toggle dark mode</span>
              <span
                className={`pointer-events-none flex items-center justify-center h-7 w-7 rounded-full bg-white shadow-lg transform ring-0 transition duration-200 ease-in-out ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              >
                {isDarkMode ? (
                  <Moon className="w-3.5 h-3.5 text-violet-600" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            id="theme-select-light"
            onClick={() => {
              if (isDarkMode) {
                if (onSetDarkMode) onSetDarkMode(false);
                else onToggleDarkMode();
              }
            }}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              !isDarkMode
                ? 'border-violet-600 bg-violet-50/40 shadow-sm ring-1 ring-violet-600/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Light Mode</h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Daylight Palette</span>
                </div>
              </div>
              {!isDarkMode && (
                <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Clean, high-contrast light theme with bright slate backgrounds and purple highlights.
            </p>
          </div>

          <div
            id="theme-select-dark"
            onClick={() => {
              if (!isDarkMode) {
                if (onSetDarkMode) onSetDarkMode(true);
                else onToggleDarkMode();
              }
            }}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              isDarkMode
                ? 'border-violet-500 bg-violet-950/30 shadow-sm ring-1 ring-violet-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-950 border border-violet-800/50 flex items-center justify-center text-violet-300">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Dark Mode</h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Obsidian Slate Palette</span>
                </div>
              </div>
              {isDarkMode && (
                <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Reduced eye-strain theme with deep obsidian backgrounds, sleek cards, and glowing accents.
            </p>
          </div>
        </div>
      </div>

      {/* ================= 1. PROFILE PICTURE & USER DETAILS ================= */}
      <div 
        id="profile-picture-section"
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6 transition-colors duration-200"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span>Profile Picture & Creator Identity</span>
          <span className="text-xs font-normal text-slate-400">Avatar Management</span>
        </h3>

        {/* Hidden file input for avatar upload */}
        <input 
          type="file"
          ref={avatarInputRef}
          onChange={handleAvatarFileSelect}
          accept="image/*"
          className="hidden"
          id="avatar-file-upload-input"
        />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Profile Picture Area */}
          <div className="relative group">
            <img
              src={avatar}
              alt={name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-violet-500/20 shadow-lg border border-slate-200 dark:border-slate-700"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 rounded-3xl bg-black/50 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition duration-200 cursor-pointer"
              title="Change profile picture"
            >
              <Camera className="w-6 h-6" />
              <span className="text-[10px] font-bold">Change</span>
            </button>
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs text-white">
              ✓
            </span>
          </div>

          {/* Profile Picture Actions & Details Summary */}
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">{name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                @{username} • {user.role} • {organization}
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-xs font-semibold border border-violet-200 dark:border-violet-800/50 mt-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Content Publisher</span>
              </div>
            </div>

            {/* Profile Picture Control Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {/* Upload button */}
              <button
                type="button"
                id="upload-profile-picture-btn"
                onClick={() => avatarInputRef.current?.click()}
                className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/50 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Profile Picture</span>
              </button>

              {/* Update photo button */}
              <button
                type="button"
                id="update-profile-picture-btn"
                onClick={() => avatarInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Update Photo</span>
              </button>

              {/* Delete profile picture button */}
              <button
                type="button"
                id="delete-profile-picture-btn"
                onClick={() => setShowDeletePhotoConfirm(true)}
                className="px-3 py-1.5 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Photo</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Supports JPG, PNG, or GIF. Recommended size 400x400px.
            </p>
          </div>
        </div>
      </div>

      {/* ================= 2. EDIT PROFILE FORM ================= */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6 transition-colors duration-200">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Edit User Profile Details</span>
            <span className="text-xs font-normal text-slate-400">* Required fields strictly validated</span>
          </h3>

          {profileError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl text-xs flex items-center gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="font-semibold">{profileError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name / Creator Pseudonym <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="edit-name-input"
                required
                pattern="^[a-zA-Z\s\-\'\.]{2,}$"
                title="Please enter a valid name (letters, spaces, hyphens, apostrophes only, min 2 characters)."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (profileError) setProfileError(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Username / Handle <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="edit-username-input"
                required
                pattern="^[a-zA-Z0-9_-]{3,}$"
                title="Username must be at least 3 characters (letters, numbers, underscores, hyphens only)."
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (profileError) setProfileError(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition font-mono"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Notification & Account Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                id="edit-email-input"
                required
                pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                title="Please enter a valid email address (e.g., user@domain.com)."
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (profileError) setProfileError(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number (Creator Verification)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  id="edit-phone-input"
                  pattern="^$|^(\+[1-9]\d{7,14}|(\(\d{3}\)\s*|\d{3}[-.\s])\d{3}[-.\s]\d{4}|\d{10,15})$"
                  title="Please enter a valid phone number (e.g., +1234567890 or (123) 456-7890)."
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (profileError) setProfileError(null);
                  }}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition font-mono"
                />
              </div>
            </div>

            {/* Organization */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Studio / Organization
              </label>
              <input
                type="text"
                id="edit-organization-input"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
              />
            </div>
          </div>
        </div>

        {/* ================= 3. BLOCKCHAIN CONFIGURATION ================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5 transition-colors duration-200">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Blockchain Ledger Configuration</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Node Synced
            </span>
          </h3>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Connected Creator Wallet Address
              </label>
              <button
                type="button"
                onClick={handleCopyWallet}
                className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWallet ? 'Copied!' : 'Copy Address'}</span>
              </button>
            </div>
            <div className="relative">
              <Wallet className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Consensus Network
              </label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
              >
                <option value="Polygon PoS (Mainnet)">Polygon PoS (Mainnet) - Lowest Gas (~$0.001)</option>
                <option value="Arbitrum One (L2)">Arbitrum One (Ethereum L2)</option>
                <option value="Ethereum Mainnet (L1)">Ethereum Mainnet (L1 Proofs)</option>
                <option value="Base Network">Base (Coinbase L2)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Hashing Standard
              </label>
              <input
                type="text"
                disabled
                value="SHA-256 (FIPS PUB 180-4 Standard)"
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* ================= 4. ACCOUNT SETTINGS (PRIVACY & NOTIFICATIONS) ================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Account Settings (Privacy & Notifications)</span>
            <Bell className="w-4 h-4 text-slate-400" />
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800 transition">
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Automatic Merkle Tree Timestamping</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Seal every uploaded content fingerprint into batch blocks automatically.</span>
              </div>
              <input
                type="checkbox"
                checked={autoTimestamp}
                onChange={(e) => setAutoTimestamp(e.target.checked)}
                className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500 accent-violet-600 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800 transition">
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Real-time Tamper Alerts</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Notify immediately if an unverified duplicate or modified hash query is executed.</span>
              </div>
              <input
                type="checkbox"
                checked={tamperAlerts}
                onChange={(e) => setTamperAlerts(e.target.checked)}
                className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500 accent-violet-600 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800 transition">
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Email Notifications</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Receive weekly summaries of content verification requests and certificates.</span>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500 accent-violet-600 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800 transition">
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Public Ledger Certificate Visibility</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Allow third-party auditors to query your registered public certificates by hash.</span>
              </div>
              <input
                type="checkbox"
                checked={publicLedgerVisibility}
                onChange={(e) => setPublicLedgerVisibility(e.target.checked)}
                className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500 accent-violet-600 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Save button for profile & settings */}
        <div className="flex items-center justify-end gap-3 pt-1">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fadeIn">
              <Check className="w-4 h-4" />
              Settings & Profile Saved Successfully!
            </span>
          )}
          <button
            type="submit"
            id="save-settings-btn"
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 cursor-pointer transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & Settings</span>
          </button>
        </div>
      </form>

      {/* ================= 5. CHANGE PASSWORD SECTION ================= */}
      <div 
        id="change-password-section"
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5 transition-colors duration-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Lock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>Change Password</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Update your account password to protect your creator keypair.
            </p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Password changed successfully!</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="current-password-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="new-password-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm-new-password-input"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          <button
            type="submit"
            id="change-password-submit-btn"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* ================= 6. ACCOUNT DEACTIVATION SECTION ================= */}
      <div 
        id="account-deactivation-section"
        className="bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl p-6 sm:p-8 border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Danger Zone: Account Deactivation</span>
            </h3>
            <p className="text-xs text-rose-700/80 dark:text-rose-400 mt-1 max-w-xl">
              Deactivating your account disables your creator identity and unbinds your local session. All existing registered blockchain proofs will remain immutable on Polygon PoS as per protocol design.
            </p>
          </div>

          <button
            type="button"
            id="deactivate-account-btn"
            onClick={() => setShowDeactivateModal(true)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm transition whitespace-nowrap cursor-pointer"
          >
            Deactivate Account
          </button>
        </div>
      </div>

      {/* ================= DELETE PROFILE PICTURE MODAL ================= */}
      {showDeletePhotoConfirm && (
        <div 
          id="delete-photo-modal-backdrop"
          onClick={() => setShowDeletePhotoConfirm(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-scaleIn space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Remove Profile Picture?</h4>
              </div>
              <button 
                type="button" 
                onClick={() => setShowDeletePhotoConfirm(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete your customized profile picture? It will be replaced with a default placeholder avatar.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeletePhotoConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-photo-btn"
                onClick={handleDeleteAvatar}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Yes, Delete Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DEACTIVATE ACCOUNT CONFIRMATION MODAL ================= */}
      {showDeactivateModal && (
        <div 
          id="deactivate-account-modal-backdrop"
          onClick={() => !isDeactivating && setShowDeactivateModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 sm:p-7 border border-rose-200 dark:border-rose-900/60 shadow-2xl animate-scaleIn space-y-4 text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Account Deactivation</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                You are about to deactivate your CreatorProof profile. Your wallet binding will be unlinked from this session and you will be signed out immediately. Existing blockchain transactions on Polygon remain immutable.
              </p>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-[11px] text-rose-800 dark:text-rose-300">
              ⚠️ This action cannot be undone. To regain publishing privileges later, you will need to register again.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeactivating}
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Keep Account
              </button>
              <button
                type="button"
                id="confirm-deactivate-btn"
                disabled={isDeactivating}
                onClick={handleDeactivateAccount}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-rose-600/20 disabled:opacity-60 flex items-center gap-2"
              >
                {isDeactivating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Deactivating...</span>
                  </>
                ) : (
                  <span>Confirm Deactivation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
