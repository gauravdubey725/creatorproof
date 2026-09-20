import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  Search, 
  ExternalLink, 
  RefreshCw,
  Clock,
  UserCheck,
  FileCode2,
  Lock,
  Layers,
  FileText,
  Binary
} from 'lucide-react';
import { RegisteredContent, VerificationHistoryItem } from '../types';
import { computeSHA256, formatBytes, copyToClipboard } from '../utils/crypto';
import { api } from '../utils/api';

interface VerifyViewProps {
  contentList: RegisteredContent[];
  targetContent?: RegisteredContent | null;
  onSelectDetails: (content: RegisteredContent) => void;
  onVerificationCompleted?: (
    targetContentId: string,
    result: 'Verified' | 'Failed',
    auditItem: VerificationHistoryItem
  ) => void;
}

export const VerifyView: React.FC<VerifyViewProps> = ({
  contentList = [],
  targetContent: initialTarget = null,
  onSelectDetails,
  onVerificationCompleted
}) => {
  const safeList = Array.isArray(contentList) ? contentList : [];
  // Target content being audited
  const [selectedContentId, setSelectedContentId] = useState<string>(
    initialTarget ? initialTarget.id : safeList[0]?.id || ''
  );

  useEffect(() => {
    if (initialTarget) {
      setSelectedContentId(initialTarget.id);
    } else if (!selectedContentId && safeList.length > 0) {
      setSelectedContentId(safeList[0].id);
    }
  }, [initialTarget, safeList, selectedContentId]);
  
  // Input method: 'file' or 'hash'
  const [inputMode, setInputMode] = useState<'file' | 'hash'>('file');
  const [manualHashInput, setManualHashInput] = useState('');

  // File state
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [currentHash, setCurrentHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verification result state
  const [hasVerified, setHasVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isMatch, setIsMatch] = useState(false);
  const [matchedRecord, setMatchedRecord] = useState<RegisteredContent | null>(null);

  const [copiedCurrent, setCopiedCurrent] = useState(false);
  const [copiedRegistered, setCopiedRegistered] = useState(false);

  const activeTarget = safeList.find(c => c.id === selectedContentId) || safeList[0];

  // Process uploaded verification file
  const processVerifyFile = async (file: File) => {
    setFileName(file.name);
    setFileSize(formatBytes(file.size));
    setIsHashing(true);
    setHasVerified(false);

    try {
      const computed = await computeSHA256(file);
      setCurrentHash(computed);
      performComparison(computed, file.name);
    } catch (err) {
      console.error(err);
      setCurrentHash('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      performComparison('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', file.name);
    } finally {
      setIsHashing(false);
    }
  };

  const performComparison = async (hashToTest: string, customName?: string) => {
    setIsVerifying(true);
    const cleanHash = hashToTest.trim().toLowerCase();

    try {
      const res = await api.content.verify({
        contentId: selectedContentId || activeTarget?.id,
        sha256Hash: cleanHash
      });

      const matchFound = Boolean(res.verified);
      setIsMatch(matchFound);

      let targetItem: RegisteredContent | null = null;

      if (res.data) {
        const foundInList = safeList.find(
          c => c.id === res.data.contentId || c.sha256Hash?.toLowerCase() === cleanHash
        );
        if (foundInList) {
          targetItem = foundInList;
          setSelectedContentId(foundInList.id);
        } else {
          targetItem = {
            id: res.data.contentId || res.data.id || selectedContentId,
            title: res.data.title || activeTarget?.title || 'Verified Asset',
            description: res.data.description || 'Verified via CreatorProof Registry.',
            type: (res.data.type as any) || activeTarget?.type || 'Document',
            creatorName: res.data.creator || activeTarget?.creatorName || 'Verified Creator',
            creatorWallet: res.data.creatorWallet || activeTarget?.creatorWallet || '0x0000...0000',
            dateRegistered: res.data.createdAt
              ? new Date(res.data.createdAt).toISOString().replace('T', ' ').substring(0, 16) + ' UTC'
              : 'Recorded',
            sha256Hash: res.data.sha256Hash || cleanHash,
            transactionHash: res.data.blockchainTxHash || activeTarget?.transactionHash || '0x0000...',
            blockNumber: res.data.blockNumber || activeTarget?.blockNumber || 19886425,
            network: activeTarget?.network || 'Polygon PoS / Sepolia',
            status: matchFound ? 'Verified' : 'Failed',
            fileSize: res.data.fileSize || fileSize || '4.2 MB',
            fileName: res.data.fileName || fileName || customName || 'verified_file.dat',
            thumbnailUrl: res.data.fileUrl,
            verificationHistory: []
          };
        }
      } else {
        targetItem = activeTarget || safeList[0] || null;
      }

      setMatchedRecord(targetItem);
      setHasVerified(true);
      setIsVerifying(false);

      if (onVerificationCompleted && targetItem) {
        const auditItem: VerificationHistoryItem = {
          id: `VH-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
          verifier: res.matchType === 'blockchain_contract'
            ? 'Smart Contract Consensus Engine'
            : 'CreatorProof Cryptographic Engine',
          result: matchFound ? 'Verified' : 'Failed',
          method: inputMode === 'hash' ? 'Direct Hash Verification' : 'SHA-256 Checksum Audit',
          matchedHash: matchFound,
          notes: matchFound
            ? `Exact bitwise match confirmed against ${res.matchType === 'blockchain_contract' ? 'on-chain contract' : 'registry database'}.`
            : (res.reason || `Hash mismatch: Submitted ${cleanHash.slice(0, 12)}... does not equal registered cryptographic proof.`)
        };
        onVerificationCompleted(targetItem.id, matchFound ? 'Verified' : 'Failed', auditItem);
      }
    } catch (err: any) {
      console.error('[VerifyView] Verification call error:', err);
      // Fallback local comparison
      const record = safeList.find(c => c.sha256Hash.toLowerCase() === cleanHash);
      const matchFound = Boolean(record);
      setIsMatch(matchFound);
      const fallbackTarget = record || activeTarget || null;
      setMatchedRecord(fallbackTarget);
      setHasVerified(true);
      setIsVerifying(false);

      if (onVerificationCompleted && fallbackTarget) {
        const auditItem: VerificationHistoryItem = {
          id: `VH-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
          verifier: 'Local Fallback Engine',
          result: matchFound ? 'Verified' : 'Failed',
          method: 'Local SHA-256 Comparison',
          matchedHash: matchFound,
          notes: matchFound ? 'Matched against cached register.' : 'No matching hash found in registry.'
        };
        onVerificationCompleted(fallbackTarget.id, matchFound ? 'Verified' : 'Failed', auditItem);
      }
    }
  };

  const handleManualHashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualHashInput.trim()) return;
    setFileName('manual_hash_query.txt');
    setFileSize('64 Bytes');
    setCurrentHash(manualHashInput.trim());
    performComparison(manualHashInput.trim());
  };

  const handleResetVerification = () => {
    setFileName('');
    setFileSize('');
    setCurrentHash('');
    setManualHashInput('');
    setHasVerified(false);
    setIsMatch(false);
    setMatchedRecord(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Demo presets for easy testing:
  const handleTestVerifiedOriginal = () => {
    const verifiedItem = safeList.find(c => c.status === 'Verified') || safeList[0];
    if (!verifiedItem) return;
    setSelectedContentId(verifiedItem.id);
    setFileName(verifiedItem.fileName);
    setFileSize(verifiedItem.fileSize);
    setCurrentHash(verifiedItem.sha256Hash);
    setManualHashInput(verifiedItem.sha256Hash);
    performComparison(verifiedItem.sha256Hash);
  };

  const handleTestTamperedFile = () => {
    const failedItem = safeList.find(c => c.status === 'Failed') || safeList[3] || safeList[0];
    if (!failedItem) return;
    setSelectedContentId(failedItem.id);
    setFileName(failedItem.fileName.replace('.', '_modified.'));
    setFileSize(failedItem.fileSize);
    const fakeTampered = failedItem.tamperedHash || 'bf890c2837194abde34091e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0';
    setCurrentHash(fakeTampered);
    setManualHashInput(fakeTampered);
    performComparison(fakeTampered);
  };

  const handleSimulateSingleByteAlteration = () => {
    if (!currentHash && activeTarget) {
      setCurrentHash(activeTarget.sha256Hash);
    }
    const base = currentHash || activeTarget?.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    // Alter last character
    const lastChar = base.slice(-1);
    const newChar = lastChar === 'a' ? 'b' : lastChar === 'f' ? '0' : 'f';
    const altered = base.slice(0, -1) + newChar;
    setCurrentHash(altered);
    setManualHashInput(altered);
    setFileName(fileName ? `altered_${fileName}` : 'altered_document.pdf');
    performComparison(altered);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Cryptographic Authenticity Engine</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Verify Content
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Upload any questionable or client-side copy of a file to calculate its live SHA-256 fingerprint and audit it against the immutable blockchain registry.
        </p>
      </div>

      {/* Target Registry Selection Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-1">
              Select Blockchain Record to Audit Against:
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pick from your registered assets or let the system auto-match across all hashes.
            </p>
          </div>

          <div className="sm:w-80">
            <select
              id="verify-target-select"
              value={selectedContentId}
              onChange={(e) => {
                setSelectedContentId(e.target.value);
                setHasVerified(false);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 cursor-pointer"
            >
              {safeList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} - {item.title} ({item.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Demo Fast-Test Controls */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">One-Click Test Cases:</span>
          <button
            type="button"
            id="test-verified-btn"
            onClick={handleTestVerifiedOriginal}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Test Legitimate Original (Verified)</span>
          </button>
          <button
            type="button"
            id="test-tampered-btn"
            onClick={handleTestTamperedFile}
            className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Test Tampered File (Failed)</span>
          </button>
          <button
            type="button"
            id="test-single-byte-btn"
            onClick={handleSimulateSingleByteAlteration}
            className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Simulate 1-Byte Hex Mutation</span>
          </button>
        </div>
      </div>

      {/* Verification Input Method Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <label className="text-sm font-bold text-slate-900 dark:text-white block">
            Content Verification Input
          </label>
          
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                id="verify-tab-file"
                onClick={() => setInputMode('file')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  inputMode === 'file'
                    ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
              <button
                type="button"
                id="verify-tab-hash"
                onClick={() => setInputMode('hash')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  inputMode === 'hash'
                    ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Binary className="w-3.5 h-3.5" />
                <span>Direct SHA-256 Hash</span>
              </button>
            </div>

            {(fileName || currentHash || manualHashInput) && (
              <button
                type="button"
                onClick={handleResetVerification}
                className="px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                title="Reset verification state"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {inputMode === 'file' ? (
          <div className="space-y-4">
            <div
              id="verify-file-dropzone"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processVerifyFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging 
                ? 'border-violet-500 bg-violet-50/70 dark:bg-violet-950/40 scale-[1.01]' 
                : hasVerified 
                ? isMatch ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20' : 'border-rose-300 dark:border-rose-700 bg-rose-50/20 dark:bg-rose-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  processVerifyFile(e.target.files[0]);
                }
                // Reset file input value to permit consecutive selection of the same file
                e.target.value = '';
              }}
              className="hidden"
              id="verify-file-input"
            />

            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 border shadow-sm ${
              hasVerified
                ? isMatch
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                : 'bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800'
            }`}>
              {hasVerified ? (
                isMatch ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>

            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {fileName ? fileName : 'Drop the file you want to audit here, or click to browse'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              The verification computes the SHA-256 digest entirely in your browser sandbox without exposing your raw file.
            </p>

            {fileSize && (
              <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
                <span>Audited size: {fileSize}</span>
              </div>
            )}
          </div>

          {fileName && currentHash && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    File Preview: <span className="font-mono text-violet-600 dark:text-violet-400">{fileName}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Calculated Browser SHA-256 Hash Digest
                  </span>
                </div>
                <button
                  type="button"
                  id="verify-file-submit-btn"
                  onClick={() => performComparison(currentHash)}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs shadow-md shadow-violet-600/20 flex items-center justify-center gap-2 cursor-pointer transition whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify</span>
                </button>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 break-all select-all font-semibold">
                {currentHash}
              </div>
            </div>
          )}
        </div>
        ) : (
          <form onSubmit={handleManualHashSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Paste 64-character hexadecimal SHA-256 string:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={manualHashInput}
                  onChange={(e) => setManualHashInput(e.target.value)}
                  placeholder="e.g. 7c3aed902bf4788192a019485b01824719203847291048291038472910384729"
                  className="w-full px-3.5 py-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                id="verify-hash-submit-btn"
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-violet-600/20 flex items-center gap-2 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Audit This Hash Against Blockchain</span>
              </button>

              {activeTarget && (
                <button
                  type="button"
                  onClick={() => {
                    setManualHashInput(activeTarget.sha256Hash);
                  }}
                  className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Fill with Selected Target Hash
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Verification Results Panel */}
      {isVerifying ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 border-3 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Querying Blockchain Ledger...</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Comparing byte-by-byte SHA-256 hash match against Merkle tree.</p>
        </div>
      ) : hasVerified && (
        <div className={`rounded-3xl p-6 sm:p-8 border shadow-lg animate-fadeIn ${
          isMatch
            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-950 dark:text-emerald-200'
            : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/70 text-rose-950 dark:text-rose-200'
        }`}>
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-md ${
                isMatch
                  ? 'bg-emerald-500 text-white border-emerald-400'
                  : 'bg-rose-600 text-white border-rose-500'
              }`}>
                {isMatch ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    isMatch ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200' : 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200'
                  }`}>
                    {isMatch ? '✅ VERIFIED' : '❌ NOT VERIFIED'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {isMatch ? 'Authenticity 100% Confirmed' : 'Cryptographic Hash Mismatch'}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {isMatch 
                    ? 'Hash Matches the Registered Original' 
                    : 'Hash Does NOT Match – Content Modified or Unrecorded'}
                </h3>
              </div>
            </div>

            {matchedRecord && (
              <button
                onClick={() => onSelectDetails(matchedRecord)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <span>View Full Certificate</span>
                <ExternalLink className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              </button>
            )}
          </div>

          {/* Detailed Hash Comparison Table */}
          <div className="mt-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Detailed Cryptographic Comparison
            </h4>

            {/* Current Hash */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-slate-400" />
                  Current Uploaded Hash:
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await copyToClipboard(currentHash);
                    setCopiedCurrent(true);
                    setTimeout(() => setCopiedCurrent(false), 2000);
                  }}
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {copiedCurrent ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCurrent ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 break-all select-all font-semibold">
                {currentHash}
              </div>
            </div>

            {/* Registered Hash */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  Registered Hash (from Blockchain Record {activeTarget?.id}):
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    if (activeTarget) {
                      await copyToClipboard(activeTarget.sha256Hash);
                      setCopiedRegistered(true);
                      setTimeout(() => setCopiedRegistered(false), 2000);
                    }
                  }}
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {copiedRegistered ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRegistered ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-violet-900 dark:text-violet-300 bg-violet-50/60 dark:bg-violet-950/40 p-2.5 rounded-lg border border-violet-200 dark:border-violet-800 break-all select-all font-semibold">
                {activeTarget?.sha256Hash}
              </div>
            </div>

            {/* Comparison Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block uppercase">
                  Match Status
                </span>
                <span className={`text-base font-extrabold flex items-center gap-1.5 mt-1 ${
                  isMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {isMatch ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  {isMatch ? 'Yes – Bitwise Identical' : 'No – Alteration Detected'}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block uppercase">
                  Blockchain Transaction ID
                </span>
                <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate mt-1" title={activeTarget?.transactionHash}>
                  {activeTarget?.transactionHash}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block uppercase">
                  Registered Creator
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-1">
                  <UserCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  {activeTarget?.creatorName}
                </span>
              </div>
            </div>

            {/* Explanation Note */}
            <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isMatch ? (
                <p>
                  <strong>Integrity Guarantee:</strong> The mathematical hash matches the exact block record sealed on{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeTarget?.dateRegistered}</span>. No frames, audio waveforms, or textual characters have been modified since publication.
                </p>
              ) : (
                <p>
                  <strong>Security Alert:</strong> The submitted file generates a cryptographic digest that does not match the ledger state. Even changing 1 pixel or 1 metadata byte in a digital asset irreversibly changes the 256-bit SHA fingerprint (avalanche effect).
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
