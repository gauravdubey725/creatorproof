const crypto = require('crypto');
const { getClient } = require('./supabase');

const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'content-files';

/**
 * Ensures the target storage bucket exists. If not, attempts creation.
 * @param {string} bucketName
 */
async function ensureBucketExists(bucketName = DEFAULT_BUCKET) {
  try {
    const supabase = getClient();
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.warn(`[Storage] Warning listing buckets: ${error.message}`);
      return;
    }

    const exists = buckets.some((b) => b.name === bucketName);
    if (!exists) {
      console.log(`[Storage] Creating bucket "${bucketName}"...`);
      const { error: createErr } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024
      });
      if (createErr) {
        console.warn(`[Storage] Notice creating bucket: ${createErr.message}`);
      } else {
        console.log(`[Storage] Bucket "${bucketName}" created successfully.`);
      }
    }
  } catch (err) {
    console.warn(`[Storage] Bucket verification check skipped: ${err.message}`);
  }
}

/**
 * Uploads a file buffer to Supabase Storage and returns its public URL.
 * File path format: users/<user_id>/<uuid>/<filename>
 *
 * @param {Buffer} fileBuffer
 * @param {string} originalFileName
 * @param {string} mimeType
 * @param {string} userId
 * @param {string} [bucketName]
 * @returns {Promise<{ path: string, publicUrl: string }>}
 */
async function uploadFile(fileBuffer, originalFileName, mimeType, userId, bucketName = DEFAULT_BUCKET) {
  const supabase = getClient();

  // Clean filename: remove special chars, retain extension
  const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileUuid = crypto.randomUUID();
  const filePath = `users/${userId}/${fileUuid}/${sanitizedFileName}`;

  // Attempt upload
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType: mimeType || 'application/octet-stream',
      upsert: true
    });

  if (error) {
    // If bucket not found error, try to create bucket once and retry
    if (error.message && error.message.toLowerCase().includes('bucket not found')) {
      await ensureBucketExists(bucketName);
      const retry = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileBuffer, {
          contentType: mimeType || 'application/octet-stream',
          upsert: true
        });
      if (retry.error) throw retry.error;
    } else {
      throw error;
    }
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: urlData.publicUrl
  };
}

/**
 * Deletes a file from storage by its path.
 * @param {string} filePath
 * @param {string} [bucketName]
 */
async function deleteFile(filePath, bucketName = DEFAULT_BUCKET) {
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(bucketName)
    .remove([filePath]);

  if (error) throw error;
  return data;
}

module.exports = {
  uploadFile,
  deleteFile,
  ensureBucketExists
};
