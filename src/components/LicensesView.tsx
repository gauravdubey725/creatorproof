import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Plus, 
  Search, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  User, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Ban, 
  FileText,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { RegisteredContent, LicenseRecord, LicenseType, LicenseStatus } from '../types';
import { shortenHash } from '../utils/crypto';

interface LicensesViewProps {
  licenses: LicenseRecord[];
  contentList: RegisteredContent[];
  onCreateLicense: (license: LicenseRecord) => void;
  onRevokeLicense: (id: string) => void;
  onDeleteLicense: (id: string) => void;
}

export const LicensesView: React.FC<LicensesViewProps> = ({
  licenses = [],
  contentList = [],
  onCreateLicense,
  onRevokeLicense,
  onDeleteLicense
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | LicenseStatus>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Close modals on Escape key & manage body scroll
  useEffect(() => {
    if (!showCreateModal && !selectedLicense) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCreateModal(false);
        setSelectedLicense(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [showCreateModal, selectedLicense]);

  // Form State
  const [contentId, setContentId] = useState('');
  const [licensee, setLicensee] = useState('');
  const [licenseeEmail, setLicenseeEmail] = useState('');
  const [licenseType, setLicenseType] = useState<LicenseType>('Commercial');
  const [fee, setFee] = useState('$500.00 Flat Fee');
  const [expiry, setExpiry] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [permissions, setPermissions] = useState(
    'Non-exclusive worldwide digital distribution and synchronization rights. Resale and sub-licensing prohibited.'
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!contentId.trim()) errors.contentId = 'Please select or provide a content ID.';
    if (!licensee.trim()) errors.licensee = 'Licensee name or organization is required.';
    if (!expiry) errors.expiry = 'Expiration date is required.';
    if (!permissions.trim()) errors.permissions = 'Rights and permissions description is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const matchedContent = contentList.find(c => c.id === contentId);
    const newLicense: LicenseRecord = {
      id: `LIC-${Date.now().toString().slice(-5)}`,
      contentId,
      contentTitle: matchedContent?.title || 'Registered Asset',
      licensee: licensee.trim(),
      licenseeEmail: licenseeEmail.trim() || undefined,
      type: licenseType,
      fee: fee.trim() || 'Free / Attribution',
      issueDate: new Date().toISOString().split('T')[0],
      expiry,
      permissions: permissions.trim(),
      status: 'Active',
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    };

    onCreateLicense(newLicense);
    setShowCreateModal(false);

    // Reset Form
    setContentId('');
    setLicensee('');
    setLicenseeEmail('');
    setFormErrors({});
  };

  const filteredLicenses = licenses.filter(lic => {
    const matchesSearch = 
      lic.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lic.contentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lic.contentTitle && lic.contentTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      lic.licensee.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || lic.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: LicenseStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Active
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
            <Calendar className="w-3 h-3 text-amber-500" />
            Expired
          </span>
        );
      case 'Revoked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
            <Ban className="w-3 h-3 text-rose-500" />
            Revoked
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800/50 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-2">
            <FileCheck className="w-3.5 h-3.5 text-violet-500" />
            <span>Digital Rights & Commercial Licensing</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            License Management
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Grant, manage, and verify blockchain-anchored intellectual property licenses for your protected assets.
          </p>
        </div>

        <button
          id="create-license-modal-btn"
          onClick={() => {
            if (contentList.length > 0 && !contentId) {
              setContentId(contentList[0].id);
            }
            setShowCreateModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-md shadow-violet-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Issue New License</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="search-licenses-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search licenses by ID, licensee, or asset title..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</span>
          {(['All', 'Active', 'Expired', 'Revoked'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Licenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {filteredLicenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <FileCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No licenses found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {licenses.length === 0
                ? "You haven't issued any licenses yet. Click 'Issue New License' to create your first agreement."
                : "No licenses match your current search or filter criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="licenses-table">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">License ID</th>
                  <th className="py-3.5 px-4">Content Asset</th>
                  <th className="py-3.5 px-4">Licensee</th>
                  <th className="py-3.5 px-4">Scope</th>
                  <th className="py-3.5 px-4">Terms / Fee</th>
                  <th className="py-3.5 px-4">Expires</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {filteredLicenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-bold text-violet-600 dark:text-violet-400">
                      {lic.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block max-w-[200px] truncate">
                          {lic.contentTitle || lic.contentId}
                        </span>
                        <span className="font-mono text-xs text-slate-400">
                          {lic.contentId}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {lic.licensee}
                      {lic.licenseeEmail && (
                        <span className="block text-xs text-slate-400 truncate max-w-[150px]">
                          {lic.licenseeEmail}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {lic.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {lic.fee}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                      {lic.expiry}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(lic.status)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedLicense(lic)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="View license details"
                        >
                          Details
                        </button>
                        {lic.status === 'Active' && (
                          <button
                            onClick={() => onRevokeLicense(lic.id)}
                            className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition cursor-pointer"
                            title="Revoke License"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteLicense(lic.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
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

      {/* Create License Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-600/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Issue IP License Agreement
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Registered Content
                </label>
                {contentList.length > 0 ? (
                  <select
                    id="license-content-select"
                    value={contentId}
                    onChange={(e) => setContentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  >
                    {contentList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} – {c.title} ({c.type})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="license-content-input"
                    value={contentId}
                    onChange={(e) => setContentId(e.target.value)}
                    placeholder="Enter Content ID (e.g. CP-9021)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                )}
                {formErrors.contentId && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.contentId}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Licensee Name / Entity
                  </label>
                  <input
                    type="text"
                    id="licensee-name-input"
                    value={licensee}
                    onChange={(e) => setLicensee(e.target.value)}
                    placeholder="Acme Media Group Inc."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                  {formErrors.licensee && (
                    <p className="text-xs text-rose-500 mt-1">{formErrors.licensee}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Licensee Email (Optional)
                  </label>
                  <input
                    type="email"
                    id="licensee-email-input"
                    value={licenseeEmail}
                    onChange={(e) => setLicenseeEmail(e.target.value)}
                    placeholder="legal@acmemedia.com"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    License Type
                  </label>
                  <select
                    id="license-type-select"
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value as LicenseType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Editorial">Editorial</option>
                    <option value="Exclusive">Exclusive</option>
                    <option value="Non-Commercial">Non-Commercial</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fee / Royalties
                  </label>
                  <input
                    type="text"
                    id="license-fee-input"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    placeholder="$500 Flat Fee"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    id="license-expiry-input"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Granted Rights & Permissions
                </label>
                <textarea
                  id="license-permissions-input"
                  rows={3}
                  value={permissions}
                  onChange={(e) => setPermissions(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
                {formErrors.permissions && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.permissions}</p>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-license-btn"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-md transition cursor-pointer"
                >
                  Issue License
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-violet-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  License Proof: {selectedLicense.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLicense(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <span className="text-slate-400 block font-medium">Asset ID & Title</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedLicense.contentTitle} ({selectedLicense.contentId})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Licensee</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedLicense.licensee}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Scope</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLicense.type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Fee</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLicense.fee}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Issue Date</span>
                  <span className="text-slate-700 dark:text-slate-300">{selectedLicense.issueDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Expiry Date</span>
                  <span className="text-slate-700 dark:text-slate-300">{selectedLicense.expiry}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold mb-1">Permissions & Rights</span>
                <p className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedLicense.permissions}
                </p>
              </div>

              {selectedLicense.txHash && (
                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Blockchain Hash Attestation</span>
                  <div className="flex items-center justify-between p-2.5 bg-slate-950 font-mono text-[11px] text-slate-300 rounded-xl border border-slate-800">
                    <span className="truncate mr-2">{selectedLicense.txHash}</span>
                    <button
                      onClick={() => handleCopy(selectedLicense.txHash!, selectedLicense.id)}
                      className="text-violet-400 hover:text-white"
                    >
                      {copiedId === selectedLicense.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLicense(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
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
