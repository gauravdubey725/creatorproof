import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Copy, 
  Check, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  FileText, 
  ExternalLink,
  Calendar,
  User,
  History,
  FileCode2,
  HardDrive,
  Printer
} from 'lucide-react';
import { RegisteredContent } from '../types';
import { copyToClipboard } from '../utils/crypto';
import { generateSingleAssetCertificatePDF } from '../utils/pdfExport';

interface ContentDetailsModalProps {
  content: RegisteredContent | null;
  onClose: () => void;
  onVerifyAgain: (content: RegisteredContent) => void;
}

export const ContentDetailsModal: React.FC<ContentDetailsModalProps> = ({
  content,
  onClose,
  onVerifyAgain
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    if (!content) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [content, onClose]);

  if (!content) return null;

  const handleCopy = async (text: string, type: 'hash' | 'tx' | 'json') => {
    await copyToClipboard(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else if (type === 'tx') {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const handleDownloadProofJson = () => {
    const proofObject = {
      protocol: "CreatorProof Blockchain IP Registry",
      version: "2.6",
      specification: "ERC-721 / Merkle Proof SHA-256 Standard",
      contentId: content.id,
      title: content.title,
      creator: {
        name: content.creatorName,
        wallet: content.creatorWallet
      },
      assetFingerprint: {
        algorithm: "SHA-256",
        digest: content.sha256Hash,
        fileName: content.fileName,
        fileSize: content.fileSize
      },
      blockchainRecord: {
        network: content.network,
        blockNumber: content.blockNumber,
        transactionHash: content.transactionHash,
        registrationDate: content.dateRegistered
      },
      auditHistory: content.verificationHistory,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(proofObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CreatorProof_Certificate_${content.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      id="content-details-modal-overlay"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div 
        id="content-details-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-scaleIn"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-violet-400">
                  {content.id}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  content.status === 'Verified' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : content.status === 'Pending'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {content.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {content.title}
              </h3>
            </div>
          </div>

          <button
            id="close-details-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Thumbnail preview if available */}
          {content.thumbnailUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 flex items-center justify-center max-h-48">
              <img 
                src={content.thumbnailUrl} 
                alt={content.title} 
                className="max-h-48 w-auto object-contain rounded-xl"
              />
              <span className="absolute bottom-2 right-2 px-2 py-1 bg-slate-900/80 backdrop-blur-xs text-[10px] text-slate-300 font-mono rounded">
                Verified SHA-256 Media Preview
              </span>
            </div>
          )}

          {/* Description & Metadata */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Content Summary & Metadata
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              {content.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Type</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{content.type}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Original File</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block" title={content.fileName}>
                  {content.fileName}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">File Size</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{content.fileSize}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Timestamp</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{content.dateRegistered.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Hashes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Cryptographic Proof Elements
            </h4>

            {/* SHA-256 */}
            <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  SHA-256 Digest (Asset Fingerprint)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(content.sha256Hash, 'hash')}
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all font-semibold">
                {content.sha256Hash}
              </p>
            </div>

            {/* Transaction Hash */}
            <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  Blockchain Transaction Hash (TxID)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(content.transactionHash, 'tx')}
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTx ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="font-mono text-xs text-violet-800 dark:text-violet-300 break-all select-all font-semibold">
                {content.transactionHash}
              </p>
            </div>

            {/* Ledger Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Network</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{content.network}</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Block Height</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">#{content.blockNumber}</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Creator</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{content.creatorName}</span>
              </div>
            </div>
          </div>

          {/* Verification History Timeline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Verification Audit History ({Array.isArray(content.verificationHistory) ? content.verificationHistory.length : 0})</span>
              </h4>
            </div>

            <div className="space-y-2.5">
              {(!content.verificationHistory || content.verificationHistory.length === 0) ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-center text-xs text-slate-500 dark:text-slate-400">
                  <span>No verification audits conducted yet. Click "Verify Again" to perform an audit.</span>
                </div>
              ) : (
                content.verificationHistory.map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">{item.verifier}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.result === 'Verified' 
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                      }`}>
                        {item.result}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span>Method: {item.method}</span>
                      <span>{item.timestamp}</span>
                    </div>
                    {item.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                        {item.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="download-pdf-cert-btn"
              onClick={() => generateSingleAssetCertificatePDF(content)}
              className="px-3.5 py-2 bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Generate and download high-resolution Cryptographic PDF Certificate"
            >
              <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>Official Certificate (PDF)</span>
            </button>
            <button
              type="button"
              id="download-proof-btn"
              onClick={handleDownloadProofJson}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>JSON Proof</span>
            </button>
            <button
              type="button"
              id="print-certificate-btn"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Print or save PDF of this certificate"
            >
              <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Print</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              id="verify-again-btn"
              onClick={() => {
                onClose();
                onVerifyAgain(content);
              }}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
