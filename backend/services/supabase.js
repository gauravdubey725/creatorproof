const { createClient } = require('@supabase/supabase-js');

// Read environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log('[Supabase] Client initialized successfully.');
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err.message);
  }
} else {
  console.warn('[Supabase] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Database operations will require valid credentials in .env.');
}

/**
 * Formats Supabase PostgREST error objects into clear Error instances
 */
function formatSupabaseError(error) {
  if (!error) return new Error('Unknown database error');
  if (error instanceof Error) return error;
  if (error.code === 'PGRST205' || (error.message && error.message.includes('schema cache'))) {
    return new Error("Database tables have not been created yet in Supabase. Please execute backend/schema.sql in your Supabase SQL Editor: https://supabase.com/dashboard/project/swpccniwvnufswqjtsfl/sql/new");
  }
  return new Error(error.message || error.details || error.hint || JSON.stringify(error));
}

/**
 * Returns the Supabase client instance or throws if not configured
 */
function getClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  }
  return supabase;
}

// ----------------------------------------------------
// User Service Methods
// ----------------------------------------------------

async function getUserByEmail(email) {
  const client = getClient();
  const { data, error } = await client
    .from('users')
    .select('*')
    .ilike('email', email.trim().toLowerCase())
    .maybeSingle();

  if (error) throw formatSupabaseError(error);
  return data;
}

async function getUserByUsername(username) {
  const client = getClient();
  const { data, error } = await client
    .from('users')
    .select('*')
    .ilike('username', username.trim().toLowerCase())
    .maybeSingle();

  if (error) throw formatSupabaseError(error);
  return data;
}

async function getUserById(id) {
  const client = getClient();
  const { data, error } = await client
    .from('users')
    .select('id, email, name, username, wallet_address, phone, website, bio, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw formatSupabaseError(error);
  return data;
}

async function createUser({ email, passwordHash, name, username, walletAddress, phone, website, bio }) {
  const client = getClient();
  const payload = {
    email: email.trim().toLowerCase(),
    password_hash: passwordHash,
    name: name ? name.trim() : null,
    username: username ? username.trim().toLowerCase() : null,
    wallet_address: walletAddress || null,
    phone: phone ? phone.trim() : null,
    website: website ? website.trim() : null,
    bio: bio ? bio.trim() : null
  };

  const { data, error } = await client
    .from('users')
    .insert([payload])
    .select('id, email, name, username, wallet_address, phone, website, bio, created_at')
    .single();

  if (error) throw formatSupabaseError(error);
  return data;
}

async function updateUser(id, updates) {
  const client = getClient();
  const allowed = ['name', 'phone', 'website', 'bio', 'wallet_address'];
  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      sanitized[key] = updates[key] !== null ? String(updates[key]).trim() : null;
    }
  }

  const { data, error } = await client
    .from('users')
    .update(sanitized)
    .eq('id', id)
    .select('id, email, name, username, wallet_address, phone, website, bio, created_at, updated_at')
    .single();

  if (error) throw formatSupabaseError(error);
  return data;
}

// ----------------------------------------------------
// Content Service Methods
// ----------------------------------------------------

async function insertContent({
  userId,
  contentId,
  title,
  type,
  description,
  fileName,
  fileSize,
  fileUrl,
  sha256Hash,
  blockchainTxHash,
  blockchainNetwork,
  blockchainStatus = 'pending',
  verified = false,
  blockNumber
}) {
  const client = getClient();
  const payload = {
    user_id: userId,
    content_id: contentId,
    title,
    type,
    description,
    file_name: fileName,
    file_size: fileSize,
    file_url: fileUrl,
    sha256_hash: sha256Hash.toLowerCase(),
    blockchain_tx_hash: blockchainTxHash || null,
    blockchain_network: blockchainNetwork || 'Polygon PoS / Sepolia',
    blockchain_status: blockchainStatus,
    verified,
    block_number: blockNumber ? Number(blockNumber) : null
  };

  const { data, error } = await client
    .from('content')
    .insert([payload])
    .select('*')
    .single();

  if (error) throw formatSupabaseError(error);
  return data;
}

async function getUserContent(userId) {
  const client = getClient();
  const { data, error } = await client
    .from('content')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw formatSupabaseError(error);
  return data || [];
}

async function getContentByContentId(contentId) {
  const client = getClient();
  const { data, error } = await client
    .from('content')
    .select('*, users:user_id (id, name, email, wallet_address)')
    .eq('content_id', contentId)
    .maybeSingle();

  if (error) throw formatSupabaseError(error);
  return data;
}

async function getContentByHash(sha256Hash) {
  const client = getClient();
  const { data, error } = await client
    .from('content')
    .select('*, users:user_id (id, name, email, wallet_address)')
    .eq('sha256_hash', sha256Hash.toLowerCase())
    .maybeSingle();

  if (error) throw formatSupabaseError(error);
  return data;
}

async function findContentByContentIdOrHash(contentId, sha256Hash) {
  const client = getClient();
  let query = client.from('content').select('*, users:user_id (id, name, email, wallet_address)');

  if (contentId && sha256Hash) {
    query = query.or(`content_id.eq.${contentId},sha256_hash.eq.${sha256Hash.toLowerCase()}`);
  } else if (contentId) {
    query = query.eq('content_id', contentId);
  } else if (sha256Hash) {
    query = query.eq('sha256_hash', sha256Hash.toLowerCase());
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw formatSupabaseError(error);
  return data;
}

// ----------------------------------------------------
// License Service Methods
// ----------------------------------------------------

async function insertLicense({
  userId,
  contentId,
  licensee,
  licenseeEmail,
  type,
  expiryDate,
  permissions,
  status = 'Active'
}) {
  const client = getClient();

  // Resolve content internal UUID if a CP- content_id was passed
  let contentUuid = contentId;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contentId);
  if (!isUuid) {
    const content = await getContentByContentId(contentId);
    if (content) {
      contentUuid = content.id;
    }
  }

  const payload = {
    user_id: userId,
    content_id: contentUuid,
    licensee,
    licensee_email: licenseeEmail || null,
    type,
    expiry_date: expiryDate,
    permissions: permissions || null,
    status
  };

  const { data, error } = await client
    .from('licenses')
    .insert([payload])
    .select('*, content:content_id (title, content_id)')
    .single();

  if (error) throw formatSupabaseError(error);
  return data;
}

async function getUserLicenses(userId) {
  const client = getClient();
  const { data, error } = await client
    .from('licenses')
    .select('*, content:content_id (title, content_id, sha256_hash)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw formatSupabaseError(error);
  return data || [];
}

// ----------------------------------------------------
// Dispute Service Methods
// ----------------------------------------------------

async function insertDispute({
  userId,
  contentId,
  claimant,
  claimantEmail,
  type,
  description,
  evidence,
  status = 'Under Review'
}) {
  const client = getClient();

  // Resolve content internal UUID if a CP- content_id was passed
  let contentUuid = contentId;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contentId);
  if (!isUuid) {
    const content = await getContentByContentId(contentId);
    if (content) {
      contentUuid = content.id;
    }
  }

  const payload = {
    user_id: userId,
    content_id: contentUuid,
    claimant,
    claimant_email: claimantEmail || null,
    type,
    description,
    evidence: evidence || null,
    status
  };

  const { data, error } = await client
    .from('disputes')
    .insert([payload])
    .select('*, content:content_id (title, content_id)')
    .single();

  if (error) throw formatSupabaseError(error);
  return data;
}

async function getUserDisputes(userId) {
  const client = getClient();
  const { data, error } = await client
    .from('disputes')
    .select('*, content:content_id (title, content_id)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw formatSupabaseError(error);
  return data || [];
}

async function deleteContent(id, userId) {
  const client = getClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let query = client.from('content').delete().eq('user_id', userId);
  if (isUuid) {
    query = query.eq('id', id);
  } else {
    query = query.eq('content_id', id);
  }
  const { data, error } = await query;
  if (error) throw formatSupabaseError(error);
  return true;
}

async function updateLicenseStatus(id, userId, status) {
  const client = getClient();
  const { data, error } = await client
    .from('licenses')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*, content:content_id (title, content_id)')
    .single();

  if (error) throw formatSupabaseError(error);
  return data;
}

async function deleteLicense(id, userId) {
  const client = getClient();
  const { data, error } = await client
    .from('licenses')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw formatSupabaseError(error);
  return true;
}

async function updateDisputeStatus(id, userId, status, resolutionNotes) {
  const client = getClient();
  const updatePayload = { status, updated_at: new Date().toISOString() };

  if (resolutionNotes) {
    try {
      const { data: existing } = await client
        .from('disputes')
        .select('description')
        .eq('id', id)
        .maybeSingle();

      const baseDesc = existing?.description || '';
      updatePayload.description = `${baseDesc}\n[Resolution Notes]: ${resolutionNotes}`.trim();
    } catch {}
  }

  const { data, error } = await client
    .from('disputes')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*, content:content_id (title, content_id)')
    .single();

  if (error) throw formatSupabaseError(error);
  return data;
}

async function deleteDispute(id, userId) {
  const client = getClient();
  const { data, error } = await client
    .from('disputes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw formatSupabaseError(error);
  return true;
}

module.exports = {
  getClient,
  getUserByEmail,
  getUserByUsername,
  getUserById,
  createUser,
  updateUser,
  insertContent,
  getUserContent,
  getContentByContentId,
  getContentByHash,
  findContentByContentIdOrHash,
  deleteContent,
  insertLicense,
  getUserLicenses,
  updateLicenseStatus,
  deleteLicense,
  insertDispute,
  getUserDisputes,
  updateDisputeStatus,
  deleteDispute
};
