import { jsPDF } from 'jspdf';
import { RegisteredContent, UserProfile } from '../types';

/**
 * Generates and downloads a cryptographic audit PDF report for registered assets.
 */
export function generateRegistryPDFReport(
  assets: RegisteredContent[],
  user?: UserProfile
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  const safeAssets = Array.isArray(assets) ? assets : [];
  const totalAssets = safeAssets.length;
  const verifiedCount = safeAssets.filter(a => a.status === 'Verified').length;
  const pendingCount = safeAssets.filter(a => a.status === 'Pending').length;
  const failedCount = safeAssets.filter(a => a.status === 'Failed').length;

  const reportId = `CP-AUDIT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const generatedAt = new Date().toUTCString();

  let currentPage = 1;

  // Helper to draw top decorative banner
  const drawHeaderBanner = (isFirstPage: boolean) => {
    // Top banner background
    doc.setFillColor(30, 27, 75); // Dark Indigo #1e1b4b
    doc.rect(0, 0, pageWidth, isFirstPage ? 36 : 20, 'F');

    // Accent line
    doc.setFillColor(139, 92, 246); // Violet-500
    doc.rect(0, isFirstPage ? 36 : 20, pageWidth, 1.5, 'F');

    if (isFirstPage) {
      // Primary Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('CREATORPROOF™ ASSET REGISTRY REPORT', marginX, 15);

      // Subtitle
      doc.setTextColor(196, 181, 253); // violet-300
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('OFFICIAL CRYPTOGRAPHIC PROOF OF EXISTENCE & IP AUDIT CERTIFICATE', marginX, 22);

      doc.setTextColor(224, 231, 255);
      doc.setFontSize(7.5);
      doc.text(`Polygon PoS Mainnet (Chain ID 137) • Report ID: ${reportId}`, marginX, 29);

      // Top right badge
      doc.setFillColor(76, 29, 149); // violet-900
      doc.roundedRect(pageWidth - marginX - 44, 9, 44, 16, 2, 2, 'F');
      doc.setTextColor(167, 139, 250);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('BLOCKCHAIN VERIFIED', pageWidth - marginX - 41, 15);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('IMMUTABLE LEDGER', pageWidth - marginX - 41, 21);
    } else {
      // Minimal Header for subsequent pages
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('CREATORPROOF™ ASSET REGISTRY REPORT', marginX, 11);

      doc.setTextColor(196, 181, 253);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Report ID: ${reportId} • ${safeAssets.length} Assets Listed`, marginX, 16);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.text('Polygon PoS Mainnet (Chain 137)', pageWidth - marginX - 44, 13);
    }
  };

  // Helper to draw footer
  const drawFooter = (pageNum: number, totalPagesEst: number) => {
    const footerY = pageHeight - 12;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 3, pageWidth - marginX, footerY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(
      'CreatorProof Verification Protocol • Cryptographic SHA-256 Fingerprints & Polygon Block Proofs • Tamper-Evident',
      marginX,
      footerY + 1
    );

    doc.setFont('helvetica', 'bold');
    doc.text(
      `Page ${pageNum} of ${totalPagesEst}`,
      pageWidth - marginX - 18,
      footerY + 1
    );
  };

  // Initialize Page 1
  drawHeaderBanner(true);

  let cursorY = 44;

  // Metadata Summary Card on Page 1
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, cursorY, contentWidth, 34, 3, 3, 'FD');

  // Summary Card Content
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('EXECUTIVE REGISTRY SUMMARY', marginX + 4, cursorY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600

  // Column 1: Creator & Generation details
  const creatorName = user?.name || (safeAssets[0]?.creatorName ?? 'Elena Rostova');
  const creatorWallet = user?.walletAddress || (safeAssets[0]?.creatorWallet ?? '0x71C...B49');

  doc.text(`Registered Creator: ${creatorName}`, marginX + 4, cursorY + 14);
  doc.text(`Signer Wallet: ${creatorWallet}`, marginX + 4, cursorY + 20);
  doc.text(`Audit Generated: ${generatedAt}`, marginX + 4, cursorY + 26);
  doc.text('Cryptographic Standard: SHA-256 (NIST FIPS 180-4)', marginX + 4, cursorY + 31);

  // Column 2: Metrics block
  const col2X = marginX + 105;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Registered Assets: ${totalAssets}`, col2X, cursorY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(22, 101, 52); // emerald-800
  doc.text(`• Fully Verified & Intact: ${verifiedCount}`, col2X, cursorY + 20);

  doc.setTextColor(161, 98, 7); // amber-700
  doc.text(`• Pending Block Confirmations: ${pendingCount}`, col2X, cursorY + 26);

  doc.setTextColor(190, 18, 60); // rose-700
  doc.text(`• Flagged / Mismatched: ${failedCount}`, col2X, cursorY + 31);

  cursorY += 40;

  // Section Header for Asset Ledger
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('REGISTERED ASSET INVENTORY & INTEGRITY PROOFS', marginX, cursorY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Comprehensive listing of all ${totalAssets} intellectual property records registered to this account.`,
    marginX,
    cursorY + 4.5
  );

  cursorY += 9;

  // Render each asset card
  safeAssets.forEach((asset, idx) => {
    const cardHeight = 35;

    // Check if card fits on the current page
    if (cursorY + cardHeight > pageHeight - 20) {
      // Add new page
      doc.addPage();
      currentPage++;
      drawHeaderBanner(false);
      cursorY = 28;
    }

    // Determine status colors
    let statusBg: [number, number, number] = [236, 253, 245]; // emerald-50
    let statusText: [number, number, number] = [4, 120, 87]; // emerald-700
    let statusLabel = 'VERIFIED';

    if (asset.status === 'Pending') {
      statusBg = [254, 243, 199]; // amber-100
      statusText = [180, 83, 9]; // amber-700
      statusLabel = 'PENDING';
    } else if (asset.status === 'Failed') {
      statusBg = [255, 228, 230]; // rose-100
      statusText = [190, 18, 60]; // rose-700
      statusLabel = 'FAILED';
    }

    // Asset Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, cursorY, contentWidth, cardHeight, 2, 2, 'FD');

    // Left accent bar
    doc.setFillColor(statusText[0], statusText[1], statusText[2]);
    doc.rect(marginX, cursorY, 2, cardHeight, 'F');

    // Top Line: Asset Title + ID
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42); // slate-900
    
    // Truncate title if needed to avoid overlapping status badge
    const rawTitle = `${idx + 1}. ${asset.title}`;
    const cleanTitle = rawTitle.length > 46 ? `${rawTitle.substring(0, 44)}...` : rawTitle;
    doc.text(cleanTitle, marginX + 5, cursorY + 5.5);

    // Type & ID pill
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`[${asset.type.toUpperCase()}] • ID: ${asset.id}`, marginX + 5, cursorY + 10.5);

    // Status Badge (Top right of card)
    const badgeWidth = 24;
    const badgeX = pageWidth - marginX - badgeWidth - 3;
    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
    doc.roundedRect(badgeX, cursorY + 3, badgeWidth, 5.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(statusText[0], statusText[1], statusText[2]);
    doc.text(statusLabel, badgeX + (badgeWidth / 2), cursorY + 6.8, { align: 'center' });

    // File Metadata Row
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `File: ${asset.fileName}  |  Size: ${asset.fileSize}  |  Registered: ${asset.dateRegistered}  |  Block: #${asset.blockNumber.toLocaleString()}`,
      marginX + 5,
      cursorY + 16
    );

    // SHA-256 Hash Box
    const hashBoxY = cursorY + 18.5;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX + 5, hashBoxY, contentWidth - 10, 8.5, 1, 1, 'FD');

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(`SHA-256: ${asset.sha256Hash}`, marginX + 7, hashBoxY + 4);

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.4);
    doc.setTextColor(100, 116, 139);
    doc.text(`TX HASH: ${asset.transactionHash}`, marginX + 7, hashBoxY + 7.2);

    // Bottom verification guarantee note
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.2);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Creator: ${asset.creatorName} (${asset.creatorWallet}) • Network: ${asset.network}`,
      marginX + 5,
      cursorY + 31.5
    );

    cursorY += cardHeight + 3.5;
  });

  // Stamp page footers across all generated pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  // Trigger browser download
  const cleanDate = new Date().toISOString().slice(0, 10);
  const fileName = `CreatorProof_Registry_Report_${cleanDate}.pdf`;
  doc.save(fileName);
}

/**
 * Generates and downloads an individual Cryptographic Certificate of Authenticity PDF
 */
export function generateSingleAssetCertificatePDF(content: RegisteredContent): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;

  // Header Banner
  doc.setFillColor(30, 27, 75); // Dark Indigo
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setFillColor(139, 92, 246); // Violet border line
  doc.rect(0, 45, pageWidth, 2, 'F');

  // Title in header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('CERTIFICATE OF CRYPTOGRAPHIC PROOF', marginX, 22);

  doc.setTextColor(196, 181, 253);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('POLYGON PROOF-OF-STAKE (PoS) IMMUTABLE CONTENT REGISTRY', marginX, 30);

  doc.setTextColor(224, 231, 255);
  doc.setFontSize(8);
  doc.text(`Asset Identifier: ${content.id} • Registered: ${content.dateRegistered}`, marginX, 38);

  // Status Badge
  const isVerified = content.status === 'Verified';
  doc.setFillColor(isVerified ? 16 : 244, isVerified ? 185 : 63, isVerified ? 129 : 94);
  doc.roundedRect(pageWidth - marginX - 38, 14, 38, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(content.status.toUpperCase(), pageWidth - marginX - 19, 21.5, { align: 'center' });

  let y = 60;

  // Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(content.title, marginX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Category: ${content.type} • File: ${content.fileName} (${content.fileSize})`, marginX, y + 6);

  y += 18;

  // Section 1: Cryptographic Fingerprint
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, y, contentWidth, 38, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text('CRYPTOGRAPHIC ASSET FINGERPRINT', marginX + 6, y + 8);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`SHA-256 HASH: ${content.sha256Hash}`, marginX + 6, y + 16);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text(`TRANSACTION:  ${content.transactionHash}`, marginX + 6, y + 23);
  doc.text(`BLOCK NUMBER: #${content.blockNumber.toLocaleString()} on ${content.network}`, marginX + 6, y + 30);

  y += 46;

  // Section 2: Provenance & Ownership
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, contentWidth, 38, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text('PROVENANCE & OWNERSHIP METADATA', marginX + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Creator / Author:     ${content.creatorName}`, marginX + 6, y + 17);
  doc.text(`Signer Wallet:        ${content.creatorWallet}`, marginX + 6, y + 24);
  doc.text(`Timestamp Standard:   RFC 3339 / ISO 8601 (${content.dateRegistered})`, marginX + 6, y + 31);

  y += 46;

  // Legal / Guarantee statement
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(marginX, y, contentWidth, 42, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(67, 56, 202);
  doc.text('LEGAL NOTICE & VERIFICATION GUARANTEE', marginX + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const legalText = `This document certifies that the digital asset referenced above was cryptographically hashed using the NIST FIPS 180-4 SHA-256 standard and sealed within block #${content.blockNumber.toLocaleString()} on the Polygon PoS decentralized ledger. Any bitwise alteration to the underlying file will invalidate this hash fingerprint. This proof is independently auditable without relying on any centralized server.`;
  const splitText = doc.splitTextToSize(legalText, contentWidth - 12);
  doc.text(splitText, marginX + 6, y + 15);

  // Footer
  const footerY = pageHeight - 16;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(marginX, footerY - 4, pageWidth - marginX, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`CreatorProof Protocol • Chain ID 137 • Generated ${new Date().toUTCString()}`, marginX, footerY);

  doc.save(`CreatorProof_Certificate_${content.id}.pdf`);
}

