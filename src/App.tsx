import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { RegisterView } from './components/RegisterView';
import { VerifyView } from './components/VerifyView';
import { MyContentView } from './components/MyContentView';
import { LicensesView } from './components/LicensesView';
import { DisputesView } from './components/DisputesView';
import { SettingsView } from './components/SettingsView';
import { ContentDetailsModal } from './components/ContentDetailsModal';
import { 
  initialContentList, 
  initialActivities,
  initialNotifications 
} from './data/mockData';
import { 
  RegisteredContent, 
  ActivityItem, 
  VerificationRecord, 
  NotificationItem,
  LicenseRecord,
  DisputeRecord,
  LicenseStatus,
  DisputeStatus,
  ContentType,
  VerificationStatus,
  LicenseType,
  DisputeType
} from './types';
import { loadState, saveState } from './utils/storage';
import { api } from './utils/api';

const sampleInitialLicenses: LicenseRecord[] = [
  {
    id: 'LIC-1001',
    contentId: 'CP-9021',
    contentTitle: 'Neon Horizon Vector Master',
    creatorEmail: 'alex.vance@creatorproof.io',
    licensee: 'Acme Media Corp',
    licenseeEmail: 'licensing@acme.com',
    type: 'Commercial',
    fee: '150 USDC',
    issueDate: '2026-03-01',
    expiry: '2027-03-01',
    permissions: 'Worldwide digital rights and broadcast distribution.',
    status: 'Active',
    txHash: '0x3a89e17b8f9024c567891234abcd5678ef901234'
  },
  {
    id: 'LIC-1002',
    contentId: 'CP-8842',
    contentTitle: 'Ambient Synthwave STEMs',
    creatorEmail: 'alex.vance@creatorproof.io',
    licensee: 'Indie Game Studio',
    licenseeEmail: 'audio@indiegame.dev',
    type: 'Commercial',
    fee: '75 USDC',
    issueDate: '2026-02-15',
    expiry: '2026-08-15',
    permissions: 'Indie game background score sync license.',
    status: 'Active',
    txHash: '0x992019485b018247192038472910482910384729'
  }
];

const sampleInitialDisputes: DisputeRecord[] = [
  {
    id: 'DSP-8001',
    contentId: 'CP-8842',
    contentTitle: 'Ambient Synthwave STEMs',
    creatorEmail: 'alex.vance@creatorproof.io',
    claimant: 'Harmonic Records Ltd',
    claimantEmail: 'legal@harmonicrecords.com',
    type: 'Copyright Infringement',
    description: 'Bassline sample claims prior publication in 2024 album release.',
    evidence: 'https://audioregistry.org/records/AR-77192',
    status: 'Under Review',
    dateFiled: '2026-03-05',
    txHash: '0x1234567890abcdef1234567890abcdef12345678'
  }
];

function MainAppContent() {
  const { user, isAuthenticated, logout, updateUser } = useAuth();

  // Active navigation page
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Application data state backed by real backend API
  const [contentList, setContentList] = useState<RegisteredContent[]>(() => {
    return user?.email ? (loadState<RegisteredContent[]>(`userContent_${user.email}`) || []) : [];
  });

  const [licenses, setLicenses] = useState<LicenseRecord[]>(() => {
    return user?.email ? (loadState<LicenseRecord[]>(`userLicenses_${user.email}`) || []) : [];
  });

  const [disputes, setDisputes] = useState<DisputeRecord[]>(() => {
    return user?.email ? (loadState<DisputeRecord[]>(`userDisputes_${user.email}`) || []) : [];
  });

  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    const saved = loadState<ActivityItem[]>('creatorproof_activities');
    return saved && saved.length > 0 ? saved : initialActivities;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = loadState<NotificationItem[]>('creatorproof_notifications');
    return saved && saved.length > 0 ? saved : initialNotifications;
  });

  // Fetch real data from backend API on login and mount
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setContentList([]);
      setLicenses([]);
      setDisputes([]);
      return;
    }

    let isMounted = true;

    async function loadBackendData() {
      try {
        const [contentRes, licensesRes, disputesRes] = await Promise.allSettled([
          api.content.getAll(),
          api.licenses.getAll(),
          api.disputes.getAll()
        ]);

        if (!isMounted) return;

        // Content
        if (contentRes.status === 'fulfilled' && contentRes.value.success && Array.isArray(contentRes.value.data)) {
          const liveItems: RegisteredContent[] = contentRes.value.data.map((item: any) => ({
            id: item.contentId || item.id,
            title: item.title,
            description: item.description || '',
            type: (item.type as ContentType) || 'Document',
            creatorName: user.name,
            creatorWallet: user.walletAddress,
            creatorEmail: user.email,
            dateRegistered: item.createdAt
              ? new Date(item.createdAt).toISOString().replace('T', ' ').substring(0, 16) + ' UTC'
              : 'Just now',
            sha256Hash: item.sha256Hash,
            transactionHash: item.blockchainTxHash || `0x${item.sha256Hash.slice(0, 40)}`,
            blockNumber: item.blockNumber || 19886425,
            network: item.blockchainNetwork || user.network || 'Polygon PoS / Sepolia',
            status: (item.verified ? 'Verified' : 'Pending') as VerificationStatus,
            fileSize: item.fileSize || '4.2 MB',
            fileName: item.fileName || 'asset.dat',
            thumbnailUrl: item.fileUrl,
            verificationHistory: [
              {
                id: `VH-${item.id.slice(-4)}`,
                timestamp: item.createdAt
                  ? new Date(item.createdAt).toISOString().replace('T', ' ').substring(0, 16) + ' UTC'
                  : 'Recorded',
                verifier: 'Registry Consensus Validator',
                result: 'Verified',
                method: 'Cryptographic SHA-256 Digest',
                matchedHash: true,
                notes: 'Anchored in cryptographic proof registry.'
              }
            ]
          }));

          if (liveItems.length > 0) {
            setContentList(liveItems);
            saveState(`userContent_${user.email}`, liveItems);
          } else if (user.email === 'alex.vance@creatorproof.io') {
            setContentList(initialContentList);
          } else {
            setContentList([]);
            saveState(`userContent_${user.email}`, []);
          }
        }

        // Licenses
        if (licensesRes.status === 'fulfilled' && licensesRes.value.success && Array.isArray(licensesRes.value.data)) {
          const liveLicenses: LicenseRecord[] = licensesRes.value.data.map((item: any) => ({
            id: item.id,
            contentId: item.contentId,
            contentTitle: item.contentTitle || 'Registered Work',
            creatorEmail: user.email,
            licensee: item.licensee,
            licenseeEmail: item.licenseeEmail,
            type: (item.type as LicenseType) || 'Commercial',
            fee: item.fee || '$150 USDC',
            issueDate: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '2026-03-01',
            expiry: item.expiryDate || '2028-12-31',
            permissions: item.permissions || 'Worldwide digital rights.',
            status: (item.status as LicenseStatus) || 'Active',
            txHash: `0x${item.id.replace(/-/g, '').slice(0, 40)}`
          }));

          if (liveLicenses.length > 0) {
            setLicenses(liveLicenses);
            saveState(`userLicenses_${user.email}`, liveLicenses);
          } else if (user.email === 'alex.vance@creatorproof.io') {
            setLicenses(sampleInitialLicenses);
          } else {
            setLicenses([]);
            saveState(`userLicenses_${user.email}`, []);
          }
        }

        // Disputes
        if (disputesRes.status === 'fulfilled' && disputesRes.value.success && Array.isArray(disputesRes.value.data)) {
          const liveDisputes: DisputeRecord[] = disputesRes.value.data.map((item: any) => ({
            id: item.id,
            contentId: item.contentId,
            contentTitle: item.contentTitle || 'Registered Work',
            creatorEmail: user.email,
            claimant: item.claimant,
            claimantEmail: item.claimantEmail,
            type: (item.type as DisputeType) || 'Copyright Infringement',
            description: item.description,
            evidence: item.evidence || '',
            status: (item.status as DisputeStatus) || 'Under Review',
            dateFiled: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '2026-03-01',
            resolutionNotes: item.resolutionNotes,
            txHash: `0x${item.id.replace(/-/g, '').slice(0, 40)}`
          }));

          if (liveDisputes.length > 0) {
            setDisputes(liveDisputes);
            saveState(`userDisputes_${user.email}`, liveDisputes);
          } else if (user.email === 'alex.vance@creatorproof.io') {
            setDisputes(sampleInitialDisputes);
          } else {
            setDisputes([]);
            saveState(`userDisputes_${user.email}`, []);
          }
        }
      } catch (err) {
        console.warn('[App] Could not fetch live backend records:', err);
      }
    }

    loadBackendData();

    return () => {
      isMounted = false;
    };
  }, [user?.email, isAuthenticated]);

  // Keep activity and notification logs persisted
  useEffect(() => {
    saveState('creatorproof_activities', activities);
  }, [activities]);

  useEffect(() => {
    saveState('creatorproof_notifications', notifications);
  }, [notifications]);

  const [selectedContentForDetails, setSelectedContentForDetails] = useState<RegisteredContent | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<RegisteredContent | null>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');

  // Live Simulated Blockchain Block Counter
  const [currentBlock, setCurrentBlock] = useState<number>(19886424);

  // Theme state: dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('creatorproof_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Keep document element class in sync with dark mode
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('creatorproof_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('creatorproof_theme', 'light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const setDarkModeExplicit = (val: boolean) => {
    setIsDarkMode(val);
  };

  useEffect(() => {
    // Tick new block every 7 seconds to simulate real blockchain activity
    const interval = setInterval(() => {
      setCurrentBlock((prev) => prev + 1);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Handle newly registered content
  const handleContentRegistered = (newContent: RegisteredContent) => {
    setContentList((prev) => [newContent, ...prev]);

    // Add activity log
    const newActivity: ActivityItem = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      title: newContent.title,
      action: 'Registered',
      type: newContent.type,
      timestamp: 'Just now',
      txHash: newContent.transactionHash,
      contentId: newContent.id
    };
    setActivities((prev) => [newActivity, ...prev]);

    // Add notification
    setNotifications((prev) => [
      {
        id: `NOTIF-${Date.now().toString().slice(-4)}`,
        title: 'New Asset Registered',
        message: `${newContent.title} (${newContent.id}) sealed on ${newContent.network}.`,
        timestamp: 'Just now',
        type: 'success',
        read: false,
        contentId: newContent.id
      },
      ...prev
    ]);
  };

  // Direct route to verify with pre-selected item
  const handleVerifyNow = (content: RegisteredContent) => {
    setVerifyTarget(content);
    setCurrentPage('verify');
    setSelectedContentForDetails(null);
  };

  // Notification handlers
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleSelectNotification = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (item.contentId) {
      const matched = contentList.find((c) => c.id === item.contentId);
      if (matched) {
        setSelectedContentForDetails(matched);
      }
    }
  };

  // Handle content deletion / archive
  const handleDeleteContent = async (contentId: string) => {
    try {
      await api.content.delete(contentId);
    } catch (err: any) {
      console.warn('[App] Server content delete notice:', err.message);
    }

    const item = contentList.find(c => c.id === contentId);
    setContentList((prev) => prev.filter((c) => c.id !== contentId));
    setActivities((prev) => [
      {
        id: `ACT-${Date.now().toString().slice(-4)}`,
        title: item ? `Archived ${item.title}` : `Archived content ${contentId}`,
        action: 'Failed',
        type: item ? item.type : 'Document',
        timestamp: 'Just now',
        txHash: item ? item.transactionHash : '0x0000...',
        contentId
      },
      ...prev
    ]);
  };

  // Handle verification completed from VerifyView
  const handleVerificationCompleted = (
    contentId: string,
    result: 'Verified' | 'Failed',
    recordOrVerifierName: any,
    maybeRecord?: VerificationRecord
  ) => {
    const record: VerificationRecord = (maybeRecord && typeof maybeRecord === 'object' && maybeRecord.id)
      ? maybeRecord
      : (recordOrVerifierName && typeof recordOrVerifierName === 'object' && recordOrVerifierName.id)
        ? recordOrVerifierName
        : {
            id: `VH-${Date.now().toString().slice(-4)}`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
            verifier: typeof recordOrVerifierName === 'string' ? recordOrVerifierName : 'Cryptographic Engine',
            result,
            method: 'SHA-256 Digest Match',
            matchedHash: result === 'Verified'
          };

    setContentList((prev) =>
      prev.map((item) => {
        if (item.id === contentId) {
          return {
            ...item,
            status: result,
            verificationHistory: [record, ...(item.verificationHistory || [])]
          };
        }
        return item;
      })
    );

    const targetItem = contentList.find(c => c.id === contentId);
    setActivities((prev) => [
      {
        id: `ACT-${Date.now().toString().slice(-4)}`,
        title: targetItem ? targetItem.title : contentId,
        action: result === 'Verified' ? 'Verified' : 'Failed',
        type: targetItem ? targetItem.type : 'Document',
        timestamp: 'Just now',
        txHash: record.txHash || (targetItem ? targetItem.transactionHash : '0x0000...'),
        contentId
      },
      ...prev
    ]);

    setNotifications((prev) => [
      {
        id: `NOTIF-${Date.now().toString().slice(-4)}`,
        title: result === 'Verified' ? 'Verification Passed' : 'Tamper Alert Detected',
        message:
          result === 'Verified'
            ? `${targetItem?.title || contentId} verified against blockchain.`
            : `Hash mismatch detected for ${targetItem?.title || contentId}!`,
        timestamp: 'Just now',
        type: result === 'Verified' ? 'success' : 'alert',
        read: false,
        contentId
      },
      ...prev
    ]);
  };

  // Licenses CRUD
  const handleCreateLicense = async (newLic: LicenseRecord) => {
    try {
      const res = await api.licenses.create({
        contentId: newLic.contentId,
        licensee: newLic.licensee,
        licenseeEmail: newLic.licenseeEmail,
        type: newLic.type,
        expiryDate: newLic.expiry,
        permissions: newLic.permissions
      });

      const created: LicenseRecord = (res.success && res.data)
        ? {
            id: res.data.id,
            contentId: res.data.contentId,
            contentTitle: res.data.contentTitle || newLic.contentTitle,
            creatorEmail: user?.email,
            licensee: res.data.licensee,
            licenseeEmail: res.data.licenseeEmail,
            type: (res.data.type as LicenseType) || newLic.type,
            fee: newLic.fee,
            issueDate: new Date(res.data.createdAt || Date.now()).toISOString().split('T')[0],
            expiry: res.data.expiryDate || newLic.expiry,
            permissions: res.data.permissions || newLic.permissions,
            status: (res.data.status as LicenseStatus) || 'Active',
            txHash: `0x${res.data.id.replace(/-/g, '').slice(0, 40)}`
          }
        : newLic;

      setLicenses((prev) => [created, ...prev]);
    } catch (err: any) {
      console.warn('[App] Server license creation notice, adding locally:', err.message);
      setLicenses((prev) => [newLic, ...prev]);
    }

    const newActivity: ActivityItem = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      title: `Issued license for ${newLic.contentTitle || newLic.contentId}`,
      action: 'Registered',
      type: 'Document',
      timestamp: 'Just now',
      txHash: newLic.txHash || '0x0000...',
      contentId: newLic.contentId
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleUpdateLicenseStatus = async (id: string, status: LicenseStatus) => {
    try {
      await api.licenses.updateStatus(id, status);
    } catch (err: any) {
      console.warn('[App] Server license status update notice:', err.message);
    }
    setLicenses((prev) =>
      prev.map((lic) => (lic.id === id ? { ...lic, status } : lic))
    );
  };

  const handleDeleteLicense = async (id: string) => {
    try {
      await api.licenses.delete(id);
    } catch (err: any) {
      console.warn('[App] Server license delete notice:', err.message);
    }
    setLicenses((prev) => prev.filter((lic) => lic.id !== id));
  };

  // Disputes CRUD
  const handleFileDispute = async (newDsp: DisputeRecord) => {
    try {
      const res = await api.disputes.create({
        contentId: newDsp.contentId,
        claimant: newDsp.claimant,
        claimantEmail: newDsp.claimantEmail,
        type: newDsp.type,
        description: newDsp.description,
        evidence: newDsp.evidence
      });

      const created: DisputeRecord = (res.success && res.data)
        ? {
            id: res.data.id,
            contentId: res.data.contentId,
            contentTitle: res.data.contentTitle || newDsp.contentTitle,
            creatorEmail: user?.email,
            claimant: res.data.claimant,
            claimantEmail: res.data.claimantEmail,
            type: (res.data.type as DisputeType) || newDsp.type,
            description: res.data.description,
            evidence: res.data.evidence,
            status: (res.data.status as DisputeStatus) || 'Under Review',
            dateFiled: new Date(res.data.createdAt || Date.now()).toISOString().split('T')[0],
            txHash: `0x${res.data.id.replace(/-/g, '').slice(0, 40)}`
          }
        : newDsp;

      setDisputes((prev) => [created, ...prev]);
    } catch (err: any) {
      console.warn('[App] Server dispute creation notice, adding locally:', err.message);
      setDisputes((prev) => [newDsp, ...prev]);
    }

    const newActivity: ActivityItem = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      title: `Dispute filed: ${newDsp.type}`,
      action: 'Failed',
      type: 'Document',
      timestamp: 'Just now',
      txHash: newDsp.txHash || '0x0000...',
      contentId: newDsp.contentId
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleUpdateDisputeStatus = async (id: string, status: DisputeStatus, notes?: string) => {
    try {
      await api.disputes.updateStatus(id, status, notes);
    } catch (err: any) {
      console.warn('[App] Server dispute status update notice:', err.message);
    }
    setDisputes((prev) =>
      prev.map((dsp) =>
        dsp.id === id ? { ...dsp, status, resolutionNotes: notes || dsp.resolutionNotes } : dsp
      )
    );
  };

  const handleDeleteDispute = async (id: string) => {
    try {
      await api.disputes.delete(id);
    } catch (err: any) {
      console.warn('[App] Server dispute delete notice:', err.message);
    }
    setDisputes((prev) => prev.filter((dsp) => dsp.id !== id));
  };

  // Navigation title lookup
  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Creator Dashboard';
      case 'register': return 'Register New Content';
      case 'verify': return 'Verify Content Authenticity';
      case 'my-content': return 'Registered Intellectual Property';
      case 'licenses': return 'Commercial IP Licenses';
      case 'disputes': return 'Dispute Resolution & Arbitration';
      case 'settings': return 'Profile & Blockchain Settings';
      default: return 'CreatorProof';
    }
  };

  // Route guard: If not authenticated, render LoginPage
  if (!isAuthenticated || !user) {
    return (
      <LoginPage 
        onLoginSuccess={() => {
          setCurrentPage('dashboard');
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans antialiased text-slate-800 dark:text-slate-100 selection:bg-violet-500 selection:text-white transition-colors duration-200">
      {/* Dark Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          if (page !== 'verify') {
            setVerifyTarget(null);
          }
        }}
        user={user}
        onLogout={logout}
        currentBlock={currentBlock}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          currentPageTitle={getPageTitle()}
          onNavigate={(page) => {
            setCurrentPage(page);
            if (page !== 'verify') setVerifyTarget(null);
          }}
          user={user}
          searchTerm={globalSearchTerm}
          onSearchChange={setGlobalSearchTerm}
          showSearch={currentPage === 'my-content' || currentPage === 'dashboard'}
          notifications={notifications}
          onMarkAllAsRead={handleMarkAllNotificationsRead}
          onClearAllNotifications={handleClearAllNotifications}
          onSelectNotification={handleSelectNotification}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        {/* Page View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardView
              user={user}
              contentList={contentList}
              activities={activities}
              currentBlock={currentBlock}
              onNavigate={(page) => setCurrentPage(page)}
              onSelectContent={(content) => setSelectedContentForDetails(content)}
              licenses={licenses}
            />
          )}

          {currentPage === 'register' && (
            <RegisterView
              user={user}
              currentBlock={currentBlock}
              onContentRegistered={handleContentRegistered}
              onNavigate={(page) => setCurrentPage(page)}
              onVerifyNow={handleVerifyNow}
            />
          )}

          {currentPage === 'verify' && (
            <VerifyView
              contentList={contentList}
              targetContent={verifyTarget}
              onSelectDetails={(content) => setSelectedContentForDetails(content)}
              onVerificationCompleted={handleVerificationCompleted}
            />
          )}

          {currentPage === 'my-content' && (
            <MyContentView
              contentList={contentList}
              user={user}
              onSelectContent={(content) => setSelectedContentForDetails(content)}
              onVerifyNow={handleVerifyNow}
              onNavigate={(page) => setCurrentPage(page)}
              onDeleteContent={handleDeleteContent}
              searchTerm={globalSearchTerm}
              onSearchChange={setGlobalSearchTerm}
            />
          )}

          {currentPage === 'licenses' && (
            <LicensesView
              licenses={licenses}
              contentList={contentList}
              onCreateLicense={handleCreateLicense}
              onRevokeLicense={(id) => handleUpdateLicenseStatus(id, 'Revoked')}
              onDeleteLicense={handleDeleteLicense}
            />
          )}

          {currentPage === 'disputes' && (
            <DisputesView
              disputes={disputes}
              contentList={contentList}
              onFileDispute={handleFileDispute}
              onUpdateDisputeStatus={handleUpdateDisputeStatus}
              onDeleteDispute={handleDeleteDispute}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsView
              user={user}
              onUpdateUser={updateUser}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
              onSetDarkMode={setDarkModeExplicit}
              onLogout={logout}
            />
          )}
        </main>
      </div>

      {/* Content Details Modal */}
      <ContentDetailsModal
        content={selectedContentForDetails}
        onClose={() => setSelectedContentForDetails(null)}
        onVerifyAgain={handleVerifyNow}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
