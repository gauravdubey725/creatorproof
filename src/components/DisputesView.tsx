import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  X, 
  Scale, 
  FileText, 
  Check, 
  Copy,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { RegisteredContent, DisputeRecord, DisputeType, DisputeStatus } from '../types';

interface DisputesViewProps {
  disputes: DisputeRecord[];
  contentList: RegisteredContent[];
  onFileDispute: (dispute: DisputeRecord) => void;
  onUpdateDisputeStatus: (id: string, status: DisputeStatus, notes?: string) => void;
  onDeleteDispute: (id: string) => void;
}

export const DisputesView: React.FC<DisputesViewProps> = ({
  disputes = [],
  contentList = [],
  onFileDispute,
  onUpdateDisputeStatus,
  onDeleteDispute
}) => {
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | DisputeStatus>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Close modals on Escape key & manage body scroll
  useEffect(() => {
    if (!showFileModal && !selectedDispute) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFileModal(false);
        setSelectedDispute(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [showFileModal, selectedDispute]);

  // Form State
  const [contentId, setContentId] = useState('');
  const [claimant, setClaimant] = useState('');
  const [claimantEmail, setClaimantEmail] = useState('');
  const [disputeType, setDisputeType] = useState<DisputeType>('Copyright Infringement');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!contentId.trim()) errors.contentId = 'Please select or provide a content ID.';
    if (!claimant.trim()) errors.claimant = 'Claimant or legal representative name is required.';
    if (!description.trim()) errors.description = 'Dispute explanation and claim grounds are required.';
    if (!evidence.trim()) errors.evidence = 'Supporting evidence (link, hash, or document reference) is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const matchedContent = contentList.find(c => c.id === contentId);
    const newDispute: DisputeRecord = {
      id: `DSP-${Date.now().toString().slice(-5)}`,
      contentId,
      contentTitle: matchedContent?.title || 'Contested Asset',
      claimant: claimant.trim(),
      claimantEmail: claimantEmail.trim() || undefined,
      type: disputeType,
      description: description.trim(),
      evidence: evidence.trim(),
      status: 'Under Review',
      dateFiled: new Date().toISOString().split('T')[0],
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    };

    onFileDispute(newDispute);
    setShowFileModal(false);

    // Reset Form
    setContentId('');
    setClaimant('');
    setClaimantEmail('');
    setDescription('');
    setEvidence('');
    setFormErrors({});
  };

  const filteredDisputes = disputes.filter(dsp => {
    const matchesSearch = 
      dsp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dsp.contentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dsp.contentTitle && dsp.contentTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      dsp.claimant.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || dsp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: DisputeStatus) => {
    switch (status) {
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
            <Clock className="w-3 h-3 text-amber-500" />
            Under Review
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Resolved
          </span>
        );
      case 'Dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Scale className="w-3 h-3 text-slate-500" />
            Dismissed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <AlertTriangle className="w-3 h-3 text-slate-500" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-semibold mb-2">
            <Scale className="w-3.5 h-3.5 text-rose-500" />
            <span>Infringement Arbitration & Claims</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dispute Resolution
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            File copyright challenges, submit cryptographic evidence, and arbitrate claims anchored to immutable blockchain timestamps.
          </p>
        </div>

        <button
          id="file-dispute-modal-btn"
          onClick={() => {
            if (contentList.length > 0 && !contentId) {
              setContentId(contentList[0].id);
            }
            setShowFileModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-md shadow-rose-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>File a Dispute</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="search-disputes-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search disputes by ID, claimant, or content..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</span>
          {(['All', 'Under Review', 'Resolved', 'Dismissed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {filteredDisputes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Scale className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No disputes recorded
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {disputes.length === 0
                ? "Your intellectual property registry currently has no active claims or infringements."
                : "No disputes match your current search or filter criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="disputes-table">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Dispute ID</th>
                  <th className="py-3.5 px-4">Content Asset</th>
                  <th className="py-3.5 px-4">Claimant</th>
                  <th className="py-3.5 px-4">Claim Nature</th>
                  <th className="py-3.5 px-4">Date Filed</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {filteredDisputes.map((dsp) => (
                  <tr key={dsp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                      {dsp.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block max-w-[180px] truncate">
                          {dsp.contentTitle || dsp.contentId}
                        </span>
                        <span className="font-mono text-xs text-slate-400">
                          {dsp.contentId}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {dsp.claimant}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                        {dsp.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                      {dsp.dateFiled}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(dsp.status)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDispute(dsp)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        >
                          Review Claim
                        </button>
                        {dsp.status === 'Under Review' && (
                          <button
                            onClick={() => onUpdateDisputeStatus(dsp.id, 'Resolved', 'Proof of authorship accepted and confirmed.')}
                            className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition cursor-pointer"
                            title="Mark as Resolved"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteDispute(dsp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* File Dispute Modal */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  File Intellectual Property Dispute
                </h3>
              </div>
              <button
                onClick={() => setShowFileModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDispute} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Registered Content
                </label>
                {contentList.length > 0 ? (
                  <select
                    id="dispute-content-select"
                    value={contentId}
                    onChange={(e) => setContentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  >
                    {contentList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} – {c.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="dispute-content-input"
                    value={contentId}
                    onChange={(e) => setContentId(e.target.value)}
                    placeholder="Enter Content ID (e.g. CP-9021)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                )}
                {formErrors.contentId && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.contentId}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Claimant / Legal Entity
                  </label>
                  <input
                    type="text"
                    id="claimant-name-input"
                    value={claimant}
                    onChange={(e) => setClaimant(e.target.value)}
                    placeholder="Jane Doe or Legal Counsel"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                  {formErrors.claimant && (
                    <p className="text-xs text-rose-500 mt-1">{formErrors.claimant}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Claimant Email (Optional)
                  </label>
                  <input
                    type="email"
                    id="claimant-email-input"
                    value={claimantEmail}
                    onChange={(e) => setClaimantEmail(e.target.value)}
                    placeholder="claimant@rights.org"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dispute Type
                </label>
                <select
                  id="dispute-type-select"
                  value={disputeType}
                  onChange={(e) => setDisputeType(e.target.value as DisputeType)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                >
                  <option value="Copyright Infringement">Copyright Infringement</option>
                  <option value="Unauthorized Commercial Use">Unauthorized Commercial Use</option>
                  <option value="Plagiarism">Plagiarism</option>
                  <option value="Attribution Violation">Attribution Violation</option>
                  <option value="Ownership Dispute">Ownership Dispute</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description of Claim & Pre-existing Rights
                </label>
                <textarea
                  id="dispute-description-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe where the original asset was created, published, or registered prior to this timestamp..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
                {formErrors.description && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cryptographic Evidence / Prior Art Hash / URL
                </label>
                <input
                  type="text"
                  id="dispute-evidence-input"
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="Prior timestamped URL, IPFS CID, or SHA-256 evidence hash"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
                {formErrors.evidence && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.evidence}</p>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFileModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-dispute-btn"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition cursor-pointer"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Claim Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Dispute Case: {selectedDispute.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <span className="text-slate-400 block font-medium">Contested Asset</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedDispute.contentTitle} ({selectedDispute.contentId})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Claimant</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedDispute.claimant}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Claim Nature</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">{selectedDispute.type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Date Filed</span>
                  <span className="text-slate-700 dark:text-slate-300">{selectedDispute.dateFiled}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold mb-1">Claim Statement</span>
                <p className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedDispute.description}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold mb-1">Evidence Reference</span>
                <div className="p-2.5 bg-slate-950 font-mono text-[11px] text-slate-300 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="truncate mr-2">{selectedDispute.evidence}</span>
                  <button
                    onClick={() => handleCopy(selectedDispute.evidence, selectedDispute.id)}
                    className="text-rose-400 hover:text-white"
                  >
                    {copiedId === selectedDispute.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {selectedDispute.resolutionNotes && (
                <div>
                  <span className="text-emerald-500 block font-semibold mb-1">Resolution Outcome</span>
                  <p className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 rounded-xl">
                    {selectedDispute.resolutionNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-2">
                {selectedDispute.status === 'Under Review' && (
                  <>
                    <button
                      onClick={() => {
                        onUpdateDisputeStatus(selectedDispute.id, 'Resolved', 'Arbitration resolved in favor of claimant. Provenance re-anchored.');
                        setSelectedDispute(null);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                    >
                      Resolve Claim
                    </button>
                    <button
                      onClick={() => {
                        onUpdateDisputeStatus(selectedDispute.id, 'Dismissed', 'Insufficient evidence provided against verified blockchain timestamp.');
                        setSelectedDispute(null);
                      }}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                    >
                      Dismiss Claim
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
