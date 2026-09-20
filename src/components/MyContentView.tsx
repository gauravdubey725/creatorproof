import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video,
  Layers,
  Plus,
  Download,
  Trash2,
  FileDown
} from 'lucide-react';
import { RegisteredContent, ContentType, VerificationStatus, UserProfile } from '../types';
import { shortenHash, copyToClipboard } from '../utils/crypto';
import { generateRegistryPDFReport } from '../utils/pdfExport';

interface MyContentViewProps {
  contentList: RegisteredContent[];
  user?: UserProfile;
  onSelectContent: (content: RegisteredContent) => void;
  onVerifyNow: (content: RegisteredContent) => void;
  onNavigate: (page: string) => void;
  onDeleteContent?: (contentId: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export const MyContentView: React.FC<MyContentViewProps> = ({
  contentList = [],
  user,
  onSelectContent,
  onVerifyNow,
  onNavigate,
  onDeleteContent,
  searchTerm: externalSearchTerm = '',
  onSearchChange: externalOnSearchChange
}) => {
  const safeList = Array.isArray(contentList) ? contentList : [];
  const [internalSearch, setInternalSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<RegisteredContent | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const searchTerm = externalSearchTerm || internalSearch;
  const handleSearchInput = (value: string) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(value);
    } else {
      setInternalSearch(value);
    }
    setCurrentPage(1);
  };

  // Filter items
  const filteredList = useMemo(() => {
    return safeList.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sha256Hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fileName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedType === 'All' || item.type === selectedType;
      const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [contentList, searchTerm, selectedType, selectedStatus]);

  // Paginate items
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  const handleCopyTx = async (tx: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await copyToClipboard(tx);
    setCopiedTxId(tx);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  const handleExportRegistry = () => {
    const exportData = {
      registryTitle: "CreatorProof Ledger Export",
      exportDate: new Date().toISOString(),
      totalRecords: filteredList.length,
      items: filteredList
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CreatorProof_Registry_Export_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDFReport = async () => {
    if (safeList.length === 0) return;
    try {
      setIsExportingPDF(true);
      // Short delay so spinner renders smoothly before synchronous PDF generation
      await new Promise(resolve => setTimeout(resolve, 80));
      generateRegistryPDFReport(safeList, user);
      setPdfSuccessMessage(true);
      setTimeout(() => setPdfSuccessMessage(false), 4000);
    } catch (err) {
      console.error("Failed to generate PDF report:", err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'Image': return <ImageIcon className="w-4 h-4 text-pink-500" />;
      case 'Audio': return <Music className="w-4 h-4 text-purple-500" />;
      case 'Video': return <Video className="w-4 h-4 text-blue-500" />;
      case 'Document': return <FileText className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Verified
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Pending
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Register Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Digital Asset Registry</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Registered Content
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Total of {contentList.length} intellectual property assets sealed with cryptographic timestamps on Polygon.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Download PDF Report of Entire Registered Assets */}
          <button
            type="button"
            id="export-pdf-report-btn"
            onClick={handleExportPDFReport}
            disabled={isExportingPDF || safeList.length === 0}
            className="px-3.5 py-2.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-violet-600/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download entire list of registered assets as an official PDF audit report"
          >
            {isExportingPDF ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-violet-200" />
            )}
            <span>{isExportingPDF ? 'Generating PDF...' : `Export PDF Report (${safeList.length})`}</span>
          </button>

          <button
            type="button"
            id="export-registry-btn"
            onClick={handleExportRegistry}
            className="px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="Export filtered records as JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>JSON</span>
          </button>

          <button
            onClick={() => onNavigate('register')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Content</span>
          </button>
        </div>
      </div>

      {/* PDF Generation Success Toast / Notification */}
      {pdfSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>
              <strong>PDF Report Generated!</strong> Downloaded complete cryptographic audit certificate containing all {safeList.length} registered asset proofs.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPdfSuccessMessage(false)}
            className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold ml-3 cursor-pointer text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="content-search-input"
              value={searchTerm}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Filter by title, content ID, hash, or filename..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          {/* Type Filters */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {['All', 'Image', 'Audio', 'Video', 'Document'].map((t) => (
              <button
                key={t}
                onClick={() => { setSelectedType(t); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedType === t
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified Only</option>
              <option value="Pending">Pending Only</option>
              <option value="Failed">Failed Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Content ID</th>
                <th className="py-3.5 px-4">Title & Details</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Date Registered</th>
                <th className="py-3.5 px-4">Blockchain Tx</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right sm:pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedList.length > 0 ? (
                paginatedList.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectContent(item)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850 dark:hover:bg-slate-800/60 transition cursor-pointer group"
                  >
                    {/* Content ID */}
                    <td className="py-4 px-4 sm:px-6 font-mono font-bold text-violet-600 dark:text-violet-400">
                      {item.id}
                    </td>

                    {/* Title */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        {item.thumbnailUrl ? (
                          <img 
                            src={item.thumbnailUrl} 
                            alt={item.title} 
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-400">
                            {getTypeIcon(item.type)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition truncate">
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-400 truncate mt-0.5">
                            {item.fileName} ({item.fileSize})
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-4 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 font-medium text-xs">
                        {getTypeIcon(item.type)}
                        <span>{item.type}</span>
                      </div>
                    </td>

                    {/* Date Registered */}
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {item.dateRegistered}
                    </td>

                    {/* Blockchain Tx */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {shortenHash(item.transactionHash, 6, 4)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyTx(item.transactionHash, e)}
                          title="Copy Transaction Hash"
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          {copiedTxId === item.transactionHash ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right sm:pr-6 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectContent(item)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:text-violet-700 dark:hover:text-violet-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                          title="View complete cryptographic certificate"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => onVerifyNow(item)}
                          className="px-2.5 py-1 bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-600 hover:text-white dark:hover:text-white text-violet-700 dark:text-violet-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                          title="Audit this item in verifier"
                        >
                          Verify Now
                        </button>
                        {onDeleteContent && (
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                            title="Remove registration"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No registered content found matching your filter criteria.</p>
                    <button
                      onClick={() => { handleSearchInput(''); setSelectedType('All'); setSelectedStatus('All'); }}
                      className="mt-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Summary Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-900 dark:text-white">{paginatedList.length}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{filteredList.length}</span> entries
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl animate-scaleIn">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Revoke Content Registration?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-700 dark:text-slate-200">{itemToDelete.title}</strong> ({itemToDelete.id}) from your active asset registry? The immutable transaction will remain permanently stored on the Polygon ledger, but it will be archived from your local creator dashboard.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-content-btn"
                onClick={() => {
                  if (onDeleteContent) {
                    onDeleteContent(itemToDelete.id);
                  }
                  setItemToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs cursor-pointer"
              >
                Yes, Remove Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
