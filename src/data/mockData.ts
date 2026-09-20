import { RegisteredContent, ActivityItem, UserProfile, NotificationItem } from '../types';

export const currentUser: UserProfile = {
  name: 'Alex Vance',
  username: 'alexvance',
  email: 'alex.vance@creatorproof.io',
  phone: '+1 (555) 234-5678',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  walletAddress: '0x71C...B82aF4d909E4B289e658e390c52136e05',
  role: 'Verified Creator',
  organization: 'Apex Studio Labs',
  network: 'Polygon PoS (Mainnet)'
};

const rawInitialContentList: RegisteredContent[] = [
  {
    id: 'CP-9021',
    title: 'My Digital Art Collection',
    description: 'High-resolution procedural generative artwork series "Nebula Echoes" edition 1/1 master file with embedded authorship signature.',
    type: 'Image',
    creatorName: 'Alex Vance',
    creatorWallet: '0x71C352932B82aF4d909E4B289e658e390c52136e',
    dateRegistered: '2026-08-28 14:32 UTC',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    transactionHash: '0x8f2a1b9487c631e50699292a1052de654b1f486e9270e53a233634e72fb4d01b',
    blockNumber: 19842104,
    network: 'Polygon PoS',
    status: 'Verified',
    fileSize: '14.8 MB',
    fileName: 'nebula_echoes_master_v1.png',
    verificationHistory: [
      {
        id: 'VH-101',
        timestamp: '2026-08-28 14:32 UTC',
        verifier: 'Initial Smart Contract Registration',
        result: 'Verified',
        method: 'On-Chain Merkle Root Attestation',
        matchedHash: true,
        notes: 'Asset hash successfully minted and sealed to block 19842104.'
      },
      {
        id: 'VH-102',
        timestamp: '2026-08-30 09:15 UTC',
        verifier: 'Creator Client Audit (Browser SHA-256)',
        result: 'Verified',
        method: 'Client Side WebCrypto SHA-256',
        matchedHash: true,
        notes: 'Hash bitwise match 100%. File integrity preserved without byte alteration.'
      }
    ]
  },
  {
    id: 'CP-9022',
    title: 'Music Album – Summer Vibes',
    description: 'Lossless 96kHz/24bit stereo master tracks for upcoming 10-track studio album release including lyrics timestamp manifests.',
    type: 'Audio',
    creatorName: 'Alex Vance',
    creatorWallet: '0x71C352932B82aF4d909E4B289e658e390c52136e',
    dateRegistered: '2026-09-02 18:45 UTC',
    sha256Hash: 'a26d7f0b9f8489c629532551a3648e89ec8a3d76e7371d9d40b3c29994c9ff5d',
    transactionHash: '0x3c91d84e4f16972e2760ab8c92e76f9273c52e8971f6a19f206cb388de9124a9',
    blockNumber: 19886420,
    network: 'Polygon PoS',
    status: 'Pending',
    fileSize: '412.5 MB',
    fileName: 'summer_vibes_lossless_master.zip',
    verificationHistory: [
      {
        id: 'VH-201',
        timestamp: '2026-09-02 18:45 UTC',
        verifier: 'Mempool Validator Node #44',
        result: 'Verified',
        method: 'Gas Confirmation Pipeline',
        matchedHash: true,
        notes: 'Awaiting 12 block confirmations for multi-chain relay sync.'
      }
    ]
  },
  {
    id: 'CP-9023',
    title: 'Project Report 2026',
    description: 'Confidential strategic research report on decentralization benchmarks, IP law frameworks, and cryptographic timestamp validity.',
    type: 'Document',
    creatorName: 'Alex Vance',
    creatorWallet: '0x71C352932B82aF4d909E4B289e658e390c52136e',
    dateRegistered: '2026-08-15 11:20 UTC',
    sha256Hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    transactionHash: '0x17c093db5f8992e105e1193aa47802bd365287f7a1f59239bb403c621182390f',
    blockNumber: 19794012,
    network: 'Polygon PoS',
    status: 'Verified',
    fileSize: '3.4 MB',
    fileName: 'CreatorProof_Architecture_2026.pdf',
    verificationHistory: [
      {
        id: 'VH-301',
        timestamp: '2026-08-15 11:20 UTC',
        verifier: 'Decentralized Timestamp Oracle',
        result: 'Verified',
        method: 'SHA-256 Ledger Anchor',
        matchedHash: true,
        notes: 'Cryptographic proof embedded into immutable ledger.'
      },
      {
        id: 'VH-302',
        timestamp: '2026-09-01 16:40 UTC',
        verifier: 'Legal Counsel Discovery Portal',
        result: 'Verified',
        method: 'Client Verification Query',
        matchedHash: true,
        notes: 'SHA-256 digest validated against block timestamp.'
      }
    ]
  },
  {
    id: 'CP-9024',
    title: 'Animation Short – The Beginning',
    description: 'Render sequence draft for 3D CGI cinematic prologue. Note: modified export file flagged during recent verification due to altered frame.',
    type: 'Video',
    creatorName: 'Alex Vance',
    creatorWallet: '0x71C352932B82aF4d909E4B289e658e390c52136e',
    dateRegistered: '2026-08-10 16:10 UTC',
    sha256Hash: '7d1a2c3e5f6b8a9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    transactionHash: '0xaa184f93cb72e482310de45688921cfb0341772189d2e76f9273c52e8971f6a1',
    blockNumber: 19741290,
    network: 'Polygon PoS',
    status: 'Failed',
    fileSize: '89.2 MB',
    fileName: 'the_beginning_prologue_v2.mp4',
    tamperedHash: 'bf890c2837194abde34091e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
    verificationHistory: [
      {
        id: 'VH-401',
        timestamp: '2026-08-10 16:10 UTC',
        verifier: 'Initial Smart Contract Registration',
        result: 'Verified',
        method: 'Ledger Registry',
        matchedHash: true,
        notes: 'Original master hash registered successfully.'
      },
      {
        id: 'VH-402',
        timestamp: '2026-09-03 14:02 UTC',
        verifier: 'Creator Verification Routine',
        result: 'Failed',
        method: 'Live File SHA-256 Check',
        matchedHash: false,
        notes: 'Tamper Alert: Submitted file hash differs from recorded blockchain hash. 3 bytes were altered in metadata.'
      }
    ]
  },
  {
    id: 'CP-9025',
    title: 'Character Design Vector Sheet',
    description: 'Master vector illustrations for protagonist avatar sprites, color palettes, and trademarked character silhouettes.',
    type: 'Image',
    creatorName: 'Alex Vance',
    creatorWallet: '0x71C352932B82aF4d909E4B289e658e390c52136e',
    dateRegistered: '2026-08-04 19:12 UTC',
    sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    transactionHash: '0x498a1f2b604e7921867cb15949d0124f8e9145892c90278152dbb0921473ae9c',
    blockNumber: 19692415,
    network: 'Polygon PoS',
    status: 'Verified',
    fileSize: '24.1 MB',
    fileName: 'protagonist_vector_kit.svg',
    verificationHistory: [
      {
        id: 'VH-501',
        timestamp: '2026-08-04 19:12 UTC',
        verifier: 'Polygon Consensus Validator',
        result: 'Verified',
        method: 'Smart Contract Event',
        matchedHash: true,
        notes: 'Fingerprint verified on-chain.'
      }
    ]
  },
  {
    id: 'CP-9026',
    title: 'Podcast Episode 42: Web3 Rights',
    description: 'Raw recorded audio interview covering open standards for creator copyright attribution, watermarking, and hash indexing.',
    type: 'Audio',
    creatorName: 'Alex Vance',
    creatorWallet: '0x71C352932B82aF4d909E4B289e658e390c52136e',
    dateRegistered: '2026-07-28 10:05 UTC',
    sha256Hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    transactionHash: '0x6291a84f3e1075b98762de341052bc7614e912389a01490217cb4187291a084e',
    blockNumber: 19612080,
    network: 'Polygon PoS',
    status: 'Verified',
    fileSize: '76.4 MB',
    fileName: 'podcast_ep42_final_master.wav',
    verificationHistory: [
      {
        id: 'VH-601',
        timestamp: '2026-07-28 10:05 UTC',
        verifier: 'Decentralized Oracle',
        result: 'Verified',
        method: 'Network Timestamp',
        matchedHash: true
      }
    ]
  },
  {
    id: 'CP-9027',
    title: 'Software Licensing Agreement v4.2',
    description: 'Official developer SDK commercial distribution license agreement signed with cryptographic creator PGP key.',
    type: 'Document',
    creatorName: 'Alex Vance',
    creatorWallet: '0x71C352932B82aF4d909E4B289e658e390c52136e',
    dateRegistered: '2026-07-19 15:40 UTC',
    sha256Hash: '87298c792f6d0f98394200f6c276326ff11e8a93ef07a6f272a275463f8d2279',
    transactionHash: '0x99014285bce90471b6932408ea01972b528194cf90182410bc931846201bce47',
    blockNumber: 19524018,
    network: 'Polygon PoS',
    status: 'Verified',
    fileSize: '1.2 MB',
    fileName: 'SDK_License_v4.2_signed.pdf',
    verificationHistory: [
      {
        id: 'VH-701',
        timestamp: '2026-07-19 15:40 UTC',
        verifier: 'Notary Smart Contract',
        result: 'Verified',
        method: 'SHA-256 Notarization',
        matchedHash: true
      }
    ]
  },
  {
    id: 'CP-9028',
    title: 'Brand Identity Guidelines 2026',
    description: 'Comprehensive brand standards, typography specifications, logo clearance zones, and visual token guidelines.',
    type: 'Document',
    creatorName: 'Alex Vance',
    creatorWallet: '0x71C352932B82aF4d909E4B289e658e390c52136e',
    dateRegistered: '2026-07-10 08:30 UTC',
    sha256Hash: '9b73c6ce6f7e52ab45903e167a8fb47388e8048d30d01bfd33a65c430e61ec97',
    transactionHash: '0x5501ba472910481ef693847290182c4918293740192841029481bc9204918293',
    blockNumber: 19412988,
    network: 'Polygon PoS',
    status: 'Verified',
    fileSize: '18.9 MB',
    fileName: 'Brand_Identity_Full_Guidelines.pdf',
    verificationHistory: [
      {
        id: 'VH-801',
        timestamp: '2026-07-10 08:30 UTC',
        verifier: 'Polygon Consensus Validator',
        result: 'Verified',
        method: 'State Trie Registration',
        matchedHash: true
      }
    ]
  },
  {
    id: 'CP-9029',
    title: 'Cinema 4D Visual FX Breakdown',
    description: 'Behind-the-scenes 4K motion graphics breakdown video showcasing procedural physics simulations and particle shaders.',
    type: 'Video',
    creatorName: 'Alex Vance',
    creatorWallet: '0x71C352932B82aF4d909E4B289e658e390c52136e',
    dateRegistered: '2026-06-25 17:15 UTC',
    sha256Hash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
    transactionHash: '0x7410bc9281740194812390481290384019283740192837401928374019283740',
    blockNumber: 19284901,
    network: 'Polygon PoS',
    status: 'Pending',
    fileSize: '142.0 MB',
    fileName: 'c4d_particle_breakdown_4k.mov',
    verificationHistory: [
      {
        id: 'VH-901',
        timestamp: '2026-06-25 17:15 UTC',
        verifier: 'Decentralized Oracle',
        result: 'Verified',
        method: 'Mempool Broadcast',
        matchedHash: true,
        notes: 'Pending final snapshot confirmation'
      }
    ]
  },
  {
    id: 'CP-9030',
    title: 'Synths & Soundscapes Sample Pack',
    description: 'Over 120 original analog synthesized wav loops, one-shots, and ambient field recordings recorded at 192kHz.',
    type: 'Audio',
    creatorName: 'Alex Vance',
    creatorWallet: '0x71C352932B82aF4d909E4B289e658e390c52136e',
    dateRegistered: '2026-06-12 12:00 UTC',
    sha256Hash: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
    transactionHash: '0x1928374019284729104817290182471920481729018247192048172901824719',
    blockNumber: 19120934,
    network: 'Polygon PoS',
    status: 'Verified',
    fileSize: '298.3 MB',
    fileName: 'Analog_Soundscapes_Vol1.zip',
    verificationHistory: [
      {
        id: 'VH-1001',
        timestamp: '2026-06-12 12:00 UTC',
        verifier: 'Polygon Consensus Validator',
        result: 'Verified',
        method: 'On-chain proof seal',
        matchedHash: true
      }
    ]
  },
  {
    id: 'CP-9031',
    title: 'Cyberpunk Skyline Matte Painting',
    description: '8K layered concept artwork created for upcoming sci-fi anthology publication featuring neon atmospheric lighting.',
    type: 'Image',
    creatorName: 'Alex Vance',
    creatorWallet: '0x71C352932B82aF4d909E4B289e658e390c52136e',
    dateRegistered: '2026-05-30 20:45 UTC',
    sha256Hash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
    transactionHash: '0x8274019283740192837401928374019283740192837401928374019283740192',
    blockNumber: 18987410,
    network: 'Polygon PoS',
    status: 'Verified',
    fileSize: '38.4 MB',
    fileName: 'cyberpunk_matte_8k_final.psd',
    verificationHistory: [
      {
        id: 'VH-1101',
        timestamp: '2026-05-30 20:45 UTC',
        verifier: 'CreatorProof Smart Contract',
        result: 'Verified',
        method: 'State Trie Registration',
        matchedHash: true
      }
    ]
  }
];

export const initialContentList: RegisteredContent[] = rawInitialContentList.map((item) => ({
  ...item,
  creatorEmail: 'alex.vance@creatorproof.io'
}));

export const initialActivities: ActivityItem[] = [
  {
    id: 'ACT-1',
    title: 'Animation Short – The Beginning',
    action: 'Verification Failed',
    type: 'Video',
    timestamp: '15 mins ago',
    txHash: '0xaa184f93cb72...',
    contentId: 'CP-9024'
  },
  {
    id: 'ACT-2',
    title: 'Music Album – Summer Vibes',
    action: 'Registered',
    type: 'Audio',
    timestamp: '2 hours ago',
    txHash: '0x3c91d84e4f16...',
    contentId: 'CP-9022'
  },
  {
    id: 'ACT-3',
    title: 'Project Report 2026',
    action: 'Verified',
    type: 'Document',
    timestamp: '1 day ago',
    txHash: '0x17c093db5f89...',
    contentId: 'CP-9023'
  },
  {
    id: 'ACT-4',
    title: 'My Digital Art Collection',
    action: 'Verified',
    type: 'Image',
    timestamp: '3 days ago',
    txHash: '0x8f2a1b9487c6...',
    contentId: 'CP-9021'
  },
  {
    id: 'ACT-5',
    title: 'Character Design Vector Sheet',
    action: 'Registered',
    type: 'Image',
    timestamp: '1 week ago',
    txHash: '0x498a1f2b604e...',
    contentId: 'CP-9025'
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'NOTIF-1',
    title: 'Tamper Alert Detected',
    message: 'Verification check failed for Animation Short – The Beginning (CP-9024). SHA-256 hash mismatch.',
    timestamp: '15 mins ago',
    type: 'alert',
    read: false,
    contentId: 'CP-9024'
  },
  {
    id: 'NOTIF-2',
    title: 'Content Registered on Polygon',
    message: 'Music Album – Summer Vibes (CP-9022) registered with block confirmation #19802140.',
    timestamp: '2 hours ago',
    type: 'success',
    read: false,
    contentId: 'CP-9022'
  },
  {
    id: 'NOTIF-3',
    title: 'Verification Completed',
    message: 'Project Report 2026 (CP-9023) 100% matched blockchain registry record.',
    timestamp: '1 day ago',
    type: 'success',
    read: true,
    contentId: 'CP-9023'
  },
  {
    id: 'NOTIF-4',
    title: 'Network Sync Active',
    message: 'Polygon PoS validator node connected at block #19842109 with 2.1s finality.',
    timestamp: '3 days ago',
    type: 'info',
    read: true
  }
];
