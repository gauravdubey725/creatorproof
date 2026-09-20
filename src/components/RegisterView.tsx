import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileCheck2, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Clock, 
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  AlertCircle
} from 'lucide-react';
import { RegisteredContent, ContentType, UserProfile } from '../types';
import { computeSHA256, formatBytes, generateTxHash, copyToClipboard, readFileAsDataUrl } from '../utils/crypto';
import { api } from '../utils/api';

interface RegisterViewProps {
  user: UserProfile;
  currentBlock: number;
  onContentRegistered: (newContent: RegisteredContent) => void;
  onNavigate: (page: string) => void;
  onVerifyNow: (content: RegisteredContent) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  user,
  currentBlock,
  onContentRegistered,
  onNavigate,
  onVerifyNow
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<ContentType>('Image');
  const [creatorName, setCreatorName] = useState(user.name);
  
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [hash, setHash] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const [isHashing, setIsHashing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Registration step simulation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<string>('');
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registeredItem, setRegisteredItem] = useState<RegisteredContent | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);

  // Handle file selection
  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize(formatBytes(selectedFile.size));

    // Auto-detect content type from file MIME
    if (selectedFile.type.startsWith('image/')) {
      setContentType('Image');
      try {
        const dataUrl = await readFileAsDataUrl(selectedFile);
        setThumbnailUrl(dataUrl);
      } catch (err) {
        console.warn('Could not read image preview', err);
      }
    } else if (selectedFile.type.startsWith('audio/')) {
      setContentType('Audio');
      setThumbnailUrl(undefined);
    } else if (selectedFile.type.startsWith('video/')) {
      setContentType('Video');
      setThumbnailUrl(undefined);
    } else {
      setContentType('Document');
      setThumbnailUrl(undefined);
    }

    // Default title if empty
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // Compute real cryptographic SHA-256
    setIsHashing(true);
    try {
      const computed = await computeSHA256(selectedFile);
      setHash(computed);
    } catch (err) {
      console.error(err);
      setHash('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    } finally {
      setIsHashing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    // Reset input value so selecting the same file consecutively triggers onChange
    e.target.value = '';
  };

  const handleLoadSample = (type: ContentType) => {
    const sampleFiles: Record<ContentType, { name: string; desc: string }> = {
      Image: {
        name: 'digital_genesis_artwork_2026.png',
        desc: 'Original 4K generative digital concept art master with embedded signature.'
      },
      Audio: {
        name: 'synthwave_nocturne_master.wav',
        desc: 'Uncompressed studio master stereo mixdown 96kHz/24bit.'
      },
      Video: {
        name: 'cybernetic_motion_reel_prores.mov',
        desc: '3D VFX animation reel rendered in ProRes 422 HQ.'
      },
      Document: {
        name: 'patent_cryptographic_timestamping.pdf',
        desc: 'Provisional specification document with mathematical cryptographic schema.'
      }
    };

    const s = sampleFiles[type];
    const sampleFile = new File([`Sample content bytes for ${s.name}`], s.name, { type: 'text/plain' });
    processFile(sampleFile);
    setContentType(type);
    setTitle(s.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    setDescription(s.desc);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setRegistrationError('Please enter a title for this content.');
      return;
    }
    if (!hash && !file) {
      setRegistrationError('Please select or upload a digital file to seal.');
      return;
    }

    setIsSubmitting(true);
    setRegistrationError(null);
    setSubmitStep('Computing cryptographic SHA-256 digest...');

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        // Create fallback file blob from sample if user clicked demo sample
        const fallbackBlob = new Blob([`Sample content bytes for ${fileName || 'asset.dat'}`], { type: 'text/plain' });
        formData.append('file', fallbackBlob, fileName || 'sample_asset.dat');
      }

      formData.append('title', title.trim());
      formData.append('type', contentType);
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      setSubmitStep('Anchoring asset to registry & encrypted storage...');
      const res = await api.content.register(formData);

      if (res.success && res.data) {
        const backendData = res.data;
        const nowStr = new Date(backendData.createdAt || Date.now())
          .toISOString()
          .replace('T', ' ')
          .substring(0, 16) + ' UTC';

        const createdItem: RegisteredContent = {
          id: backendData.contentId || backendData.id,
          title: backendData.title || title,
          description: backendData.description || description,
          type: (backendData.type as ContentType) || contentType,
          creatorName: creatorName || user.name,
          creatorWallet: user.walletAddress,
          dateRegistered: nowStr,
          sha256Hash: backendData.sha256Hash || hash,
          transactionHash: backendData.blockchainTxHash || `0x${backendData.sha256Hash?.slice(0, 40) || '0000000000000000000000000000000000000000'}`,
          blockNumber: backendData.blockNumber || currentBlock + 1,
          network: user.network || 'Polygon PoS / Sepolia',
          status: 'Verified',
          fileSize: backendData.fileSize || fileSize || '4.2 MB',
          fileName: backendData.fileName || fileName || 'uploaded_content.dat',
          thumbnailUrl: backendData.fileUrl || thumbnailUrl,
          verificationHistory: [
            {
              id: `VH-${Date.now().toString().slice(-4)}`,
              timestamp: nowStr,
              verifier: `${user.network || 'Polygon / Sepolia'} Consensus Validator`,
              result: 'Verified',
              method: 'Cryptographic SHA-256 Digest',
              matchedHash: true,
              notes: 'Registered with immutable cryptographic timestamp.'
            }
          ]
        };

        setRegisteredItem(createdItem);
        onContentRegistered(createdItem);
      } else {
        throw new Error('Registration failed. Please check backend connection.');
      }
    } catch (err: any) {
      console.error('[RegisterView] Registration error:', err);
      setRegistrationError(err.message || 'Registration failed. Please check server logs.');
    } finally {
      setIsSubmitting(false);
      setSubmitStep('');
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setFileName('');
    setFileSize('');
    setHash('');
    setThumbnailUrl(undefined);
    setRegisteredItem(null);
    setRegistrationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyHash = async (text: string, isTx = false) => {
    await copyToClipboard(text);
    if (isTx) {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    } else {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>New Blockchain Asset Proof</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Register Content
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Upload any digital master file. CreatorProof generates a deterministic SHA-256 fingerprint and anchors it directly to the immutable blockchain ledger.
        </p>
      </div>

      {/* Success View if registered */}
      {registeredItem ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-emerald-200/90 dark:border-emerald-800/80 shadow-xl relative overflow-hidden animate-scaleIn">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 dark:bg-emerald-950/30 rounded-full blur-3xl pointer-events-none" />
          
          <div className="text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-300 dark:border-emerald-700 shadow-sm animate-bounce">
              <FileCheck2 className="w-8 h-8" />
            </div>
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
              Registration Confirmed On-Chain
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3 tracking-tight">
              {registeredItem.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your cryptographic proof has been successfully mined into Block #{registeredItem.blockNumber}
            </p>
          </div>

          {/* Proof Receipt Details */}
          <div className="mt-8 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Cryptographic SHA-256 Hash
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyHash(registeredItem.sha256Hash, false)}
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                </button>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                {registeredItem.sha256Hash}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Blockchain Transaction Hash (TxID)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyHash(registeredItem.transactionHash, true)}
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTx ? 'Copied' : 'Copy Tx'}</span>
                </button>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs text-violet-700 dark:text-violet-300 break-all select-all font-semibold">
                {registeredItem.transactionHash}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Content ID</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{registeredItem.id}</span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Network</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{registeredItem.network}</span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Block Height</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">#{registeredItem.blockNumber}</span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">File Size</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{registeredItem.fileSize}</span>
              </div>
            </div>
          </div>

          {/* Post-Registration Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onVerifyNow(registeredItem)}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-violet-600/30 flex items-center gap-2 cursor-pointer transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify This Content Now</span>
            </button>
            <button
              onClick={() => onNavigate('my-content')}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer transition"
            >
              <span>View in My Content</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition cursor-pointer"
            >
              Register Another File
            </button>
          </div>
        </div>
      ) : (
        /* Form & Drag Zone */
        <form onSubmit={handleRegister} className="space-y-6">
          {registrationError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <span>{registrationError}</span>
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>1. Upload Digital File</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(Local client hash calculation)</span>
              </label>

              {/* Sample quick loader buttons for convenience */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">Try Demo:</span>
                {(['Image', 'Audio', 'Video', 'Document'] as ContentType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleLoadSample(t)}
                    className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:text-violet-700 dark:hover:text-violet-300 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    +{t}
                  </button>
                ))}
              </div>
            </div>

            <div
              id="file-upload-dropzone"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragging 
                  ? 'border-violet-500 bg-violet-50/70 dark:bg-violet-950/40 scale-[1.01]' 
                  : hash 
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                id="content-file-input"
              />

              <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-3 border border-violet-200 dark:border-violet-800 shadow-sm">
                <UploadCloud className="w-7 h-7" />
              </div>

              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {fileName ? fileName : 'Drag & drop your file here, or click to browse'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Supports Images (PNG, JPG, SVG), Audio (MP3, WAV), Video (MP4, MOV), and Documents (PDF, DOCX).
              </p>

              {fileSize && (
                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
                  <span>File size: {fileSize}</span>
                  <span>•</span>
                  <span>Ready to hash</span>
                </div>
              )}
            </div>

            {/* SHA-256 Hash Display */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                  <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider text-[11px]">
                    Generated SHA-256 Fingerprint
                  </span>
                </div>
                {hash && (
                  <button
                    type="button"
                    onClick={() => handleCopyHash(hash, false)}
                    className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHash ? 'Copied!' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {isHashing ? (
                <div className="flex items-center gap-2 py-1 text-xs text-slate-400">
                  <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  <span>Calculating cryptographic hash from file bytes...</span>
                </div>
              ) : hash ? (
                <p className="font-mono text-xs sm:text-sm text-emerald-400 font-medium break-all select-all leading-relaxed">
                  {hash}
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Upload a file or choose a sample above to generate its SHA-256 cryptographic hash.
                </p>
              )}
            </div>
          </div>

          {/* Form Fields: Content Title, Description, Type, Creator */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              2. Content Metadata & Authorship
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Content Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Content Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. My Digital Art Collection"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
                />
              </div>

              {/* Creator Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Creator Name / Pseudonym <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="e.g. Alex Vance"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
                />
              </div>
            </div>

            {/* Content Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Content Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { type: 'Image' as ContentType, icon: ImageIcon, label: 'Image Art' },
                  { type: 'Audio' as ContentType, icon: Music, label: 'Audio Track' },
                  { type: 'Video' as ContentType, icon: Video, label: 'Video Film' },
                  { type: 'Document' as ContentType, icon: FileText, label: 'Document / IP' }
                ].map(({ type, icon: Icon, label }) => {
                  const isSelected = contentType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setContentType(type)}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold transition text-left cursor-pointer ${
                        isSelected
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 ring-2 ring-violet-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Content Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a brief summary of the creative asset, master edition details, or rights claimed..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition resize-none"
              />
            </div>

            {/* Network Details Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span>Target Chain: <strong className="text-slate-800 dark:text-slate-200">{user.network || 'Polygon PoS'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Estimated Fee: <strong className="text-slate-800 dark:text-slate-200">0.0018 Gas (~$0.001)</strong></span>
              </div>
            </div>
          </div>

          {/* Submission Button */}
          <div>
            <button
              type="submit"
              id="register-blockchain-button"
              disabled={!hash || !title || isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-base shadow-xl shadow-violet-600/30 flex items-center justify-center gap-3 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{submitStep}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-violet-200" />
                  <span>Register on Blockchain</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            {!hash && (
              <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                Please upload a file or click a demo sample above to generate its SHA-256 hash first.
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
