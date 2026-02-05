import {
  addMemberToOrganization,
  getOrganizationBySlug,
  getOrganizationMembers,
  getUserMembership,
  getUserOrganizations,
} from "@/lib/db/organizations";
import { logOAuth } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

console.log(">>> LOADING AUTH CALLBACK MODULE <<<");

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  console.log("-----------------------------------------");
  console.log("RAW REQUEST URL:", request.url);
  console.log("HEADERS:", Object.fromEntries(request.headers.entries()));

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const cookieStore = await cookies();

  // Get org slug from search params OR from cookie
  let orgSlug = requestUrl.searchParams.get("org") || cookieStore.get("sb_org_slug")?.value;
  const isNewOrg = requestUrl.searchParams.get("new") === "true";

  // Check for error and error_description from Supabase
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  console.log("=== OAuth Callback Handler ===");
  console.log("Full URL received:", requestUrl.href);
  console.log("Search parameters:", requestUrl.searchParams.toString());

  logOAuth("=== OAuth Callback Handler START ===", { url: requestUrl.href, orgSlug });

  if (error) {
    console.error("Supabase OAuth error:", error, errorDescription);
    logOAuth("Supabase OAuth error param", { error, errorDescription });
    return NextResponse.redirect(
      `${requestUrl.origin}/org-login?error=oauth_error&details=${encodeURIComponent(errorDescription || error)}`,
    );
  }

  // If we have a code, exchange it for a session
  if (code) {
    console.log("Exchanging code for session...");
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      logOAuth("Code exchange result", {
        error: exchangeError ? exchangeError.message : null,
        hasSession: !!data?.session,
      });

      if (exchangeError) {
        console.error("Code exchange error:", exchangeError);
        return NextResponse.redirect(
          `${requestUrl.origin}/org-login?error=exchange_failed&details=${encodeURIComponent(exchangeError.message)}`,
        );
      }

      if (!data?.session) {
        console.error("No session after code exchange");
        return NextResponse.redirect(`${requestUrl.origin}/org-login?error=no_session_after_exchange`);
      }

      const session = data.session;
      const user = session.user;
      console.log("Code exchanged successfully! User:", user.email);

      // Clean up the org cookie
      cookieStore.delete("sb_org_slug");

      let organization = null;
      if (orgSlug) {
        // Verify specifically requested organization exists
        organization = await getOrganizationBySlug(orgSlug);
        if (!organization) {
          console.warn("Requested organization not found:", orgSlug);
        }
      }

      // If specific org not found or not provided, try to find ANY org the user belongs to
      if (!organization) {
        console.log("No specific org found, checking user memberships...");
        const userOrgs = await getUserOrganizations(user.id);
        if (userOrgs && userOrgs.length > 0) {
          // Default to the first organization
          organization = userOrgs[0];
          orgSlug = organization.slug;
          console.log("Defaulting to user's first org:", orgSlug);
        }
      }

      // If STILL no organization, user needs to create one or is in a weird state
      if (!organization) {
        console.error("No organization context available for user");
        if (isNewOrg) {
          // This shouldn't theoretically happen if isNewOrg is true but org slug is missing
          // but we can fallback to org registration
          return NextResponse.redirect(`${requestUrl.origin}/org-register`);
        }
        return NextResponse.redirect(`${requestUrl.origin}/org-register?error=no_org_found`);
      }

      console.log("Target Organization:", organization.name);

      // Check if user is already a member (redundant if we just fetched userOrgs, but good for safety)
      const membership = await getUserMembership(organization.id, user.id);

      if (membership) {
        console.log("User is already a member, role:", membership.role);
        logOAuth("Existing member redirecting to dashboard", { role: membership.role });
        return NextResponse.redirect(`${requestUrl.origin}/dashboard?org=${orgSlug}`);
      }

      // If we are here, user is authenticated but NOT a member of the target org.
      // This happens if they tried to log into 'lucidetech' but aren't a member.
      // In that case, we should probably check if they are a member of ANY org (again)
      // but if we are in 'isNewOrg' flow, we add them.

      // Redirect to role selection or dashboard
      if (isNewOrg) {
        console.log("Adding user as founder");
        await addMemberToOrganization(organization.id, user.id, "founder");
        return NextResponse.redirect(`${requestUrl.origin}/dashboard?org=${orgSlug}`);
      }

      // Fallback: User tried to join specific org but isn't a member.
      // Automate role selection: Check existing members
      const members = await getOrganizationMembers(organization.id);
      const roleToAssign = members.length === 0 ? "founder" : "intern";

      console.log(`[Auth Callback] Auto-assigning role '${roleToAssign}' to new member`);
      await addMemberToOrganization(organization.id, user.id, roleToAssign);

      return NextResponse.redirect(`${requestUrl.origin}/dashboard?org=${orgSlug}`);
    } catch (err) {
      console.error("Exception in callback processing:", err);
      logOAuth("Callback Exception", { error: String(err) });
      return NextResponse.redirect(
        `${requestUrl.origin}/org-login?error=callback_exception&details=${encodeURIComponent(String(err))}`,
      );
    }
  } else {
    console.warn("No code provided in OAuth callback");
    logOAuth("Missing code in callback");
    return NextResponse.redirect(`${requestUrl.origin}/org-login?error=missing_code`);
  }
}
