import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export type Organization = {
  id: string;
  name: string;
  slug: string;
  invitation_code: string;
  hierarchy_type: "fixed" | "custom";
  created_at: string;
  updated_at: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  assigned_role_id: string;
  created_at: string;
  updated_at: string;
};

/**
 * Generate a URL-friendly slug from organization name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Get all organizations
 */
export async function getOrganizations() {
  const { data, error } = await supabase.from("organizations").select("*").order("created_at", { ascending: true });

  if (error) throw error;
  return data as Organization[];
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string) {
  console.log("[DB] getOrganizationBySlug - Looking for slug:", slug);

  const { data, error } = await supabase.from("organizations").select("*").eq("slug", slug).single();

  if (error) {
    if (error.code === "PGRST116") {
      console.log("[DB] getOrganizationBySlug - Organization not found");
      return null; // Not found
    }
    console.error("[DB] getOrganizationBySlug - Error:", error);
    throw error;
  }

  console.log("[DB] getOrganizationBySlug - Found organization:", data.name, "ID:", data.id);
  return data as Organization;
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(id: string) {
  const { data, error } = await supabase.from("organizations").select("*").eq("id", id).single();

  if (error) throw error;
  return data as Organization;
}

/**
 * Create a new organization
 */
export async function createOrganization(
  name: string,
  creatorUserId?: string,
  hierarchyType: "fixed" | "custom" = "fixed",
  customRoles?: { role_name: string; hierarchy_level: number }[]
) {
  let slug = generateSlug(name);

  // Generate a 6-character alphanumeric invitation code
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let invitationCode = "";
  for (let i = 0; i < 6; i++) {
    invitationCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Ensure slug is unique
  let slugExists = await getOrganizationBySlug(slug);
  let counter = 1;
  while (slugExists) {
    slug = `${generateSlug(name)}-${counter}`;
    slugExists = await getOrganizationBySlug(slug);
    counter++;
  }

  const { data, error } = await supabase
    .from("organizations")
    .insert({ name, slug, invitation_code: invitationCode, hierarchy_type: hierarchyType })
    .select()
    .single();

  if (error) throw error;

  // If custom hierarchy, create the custom roles
  if (hierarchyType === "custom" && customRoles && customRoles.length > 0) {
    const rolesToInsert = customRoles.map(role => ({
      organization_id: data.id,
      role_name: role.role_name,
      hierarchy_level: role.hierarchy_level,
    }));
    const { error: rolesError } = await supabase
      .from("roles")
      .insert(rolesToInsert);
    if (rolesError) throw rolesError;
  }

  // If creator user ID provided, add them as founder
  if (creatorUserId) {
    let assignedRoleId: string | undefined;
    if (hierarchyType === "custom") {
      const { data: roleData } = await supabase
        .from("roles")
        .select("id")
        .eq("organization_id", data.id)
        .eq("hierarchy_level", 1)
        .single();
      if (roleData) assignedRoleId = roleData.id;
    }
    await addMemberToOrganization(data.id, creatorUserId, "founder", assignedRoleId);
  }

  return data as Organization;
}

/**
 * Update organization
 */
export async function updateOrganization(id: string, updates: { name?: string }) {
  const updateData: any = { ...updates, updated_at: new Date().toISOString() };

  // If name is updated, regenerate slug
  if (updates.name) {
    updateData.slug = generateSlug(updates.name);
  }

  const { data, error } = await supabase.from("organizations").update(updateData).eq("id", id).select().single();

  if (error) throw error;
  return data as Organization;
}

/**
 * Add a member to an organization
 */
export async function addMemberToOrganization(
  organizationId: string,
  userId: string,
  role: string = "intern",
  assignedRoleId?: string,
) {
  console.log("[DB] addMemberToOrganization - Org ID:", organizationId, "User ID:", userId, "Role:", role, "Assigned Role ID:", assignedRoleId);

  const insertData: any = {
    organization_id: organizationId,
    user_id: userId,
    role,
  };
  if (assignedRoleId) {
    insertData.assigned_role_id = assignedRoleId;
  }

  const { data, error } = await supabase
    .from("organization_members")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("[DB] addMemberToOrganization - Error:", error);
    throw error;
  }

  console.log("[DB] addMemberToOrganization - Member added successfully");
  return data as OrganizationMember;
}

/**
 * Get all members of an organization
 */
export async function getOrganizationMembers(organizationId: string) {
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as OrganizationMember[];
}

/**
 * Get user's membership in an organization
 */
export async function getUserMembership(organizationId: string, userId: string) {
  console.log("[DB] getUserMembership - Org ID:", organizationId, "User ID:", userId);

  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      console.log("[DB] getUserMembership - No membership found");
      return null; // Not found
    }
    console.error("[DB] getUserMembership - Error:", error);
    throw error;
  }

  console.log("[DB] getUserMembership - Found membership, role:", data.role);
  return data as OrganizationMember;
}

/**
 * Get all organizations a user belongs to
 */
export async function getUserOrganizations(userId: string) {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(*)")
    .eq("user_id", userId);

  if (error) throw error;
  return data.map((item: any) => ({
    ...item.organizations,
    userRole: item.role,
  }));
}

/**
 * Update member role
 */
export async function updateMemberRole(
  organizationId: string,
  userId: string,
  role?: string,
  assignedRoleId?: string,
) {
  const updateData: any = { updated_at: new Date().toISOString() };
  if (role !== undefined) updateData.role = role;
  if (assignedRoleId !== undefined) updateData.assigned_role_id = assignedRoleId;

  const { data, error } = await supabase
    .from("organization_members")
    .update(updateData)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as OrganizationMember;
}

/**
 * Remove member from organization
 */
export async function removeMemberFromOrganization(organizationId: string, userId: string) {
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Verify invitation code
 */
export async function verifyOrganizationCode(slug: string, code: string) {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, hierarchy_type")
    .eq("slug", slug)
    .eq("invitation_code", code)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
