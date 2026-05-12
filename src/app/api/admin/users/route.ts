

export const dynamic = 'force-dynamic';
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Helper to safely get Admin Client
function getAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    console.log('[getAdminClient] Checking environment variables...');
    console.log('[getAdminClient] SUPABASE_URL exists:', !!supabaseUrl);
    console.log('[getAdminClient] SERVICE_ROLE_KEY exists:', !!serviceRoleKey);
    console.log('[getAdminClient] SERVICE_ROLE_KEY length:', serviceRoleKey?.length || 0);

    if (!serviceRoleKey || serviceRoleKey.trim() === '') {
        console.error("FATAL: SUPABASE_SERVICE_ROLE_KEY is missing or empty in env variables!");
        console.error("Please check .env.local file and restart the dev server.");
        return null;
    }
    if (!supabaseUrl || supabaseUrl.trim() === '') {
        console.error("FATAL: NEXT_PUBLIC_SUPABASE_URL is missing or empty!");
        return null;
    }

    return createClient(
        supabaseUrl,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

export async function POST(request: Request) {
    try {
        const supabaseAdmin = getAdminClient();
        if (!supabaseAdmin) {
            return NextResponse.json({ error: "Server Configuration Error: Missing Service Key" }, { status: 500 });
        }

        // 1. Verify Current User is Admin
        const cookieStore = cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('[API Admin Users] Missing Supabase env variables');
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: currentUserProfile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

        if (currentUserProfile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        // 2. Parse Request Body
        const body = await request.json();
        const { email, password, fullName, role, misa_employee_code, misa_branch_code, zalo_phone, zalo_password, zalo_backup_password } = body;

        if (!email || !password || !fullName || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 3. Create User in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) {
            console.error("Auth Create Error:", authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        const newUserId = authData.user.id;

        // 4. Profile Upsert
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
                id: newUserId,
                email: email,
                full_name: fullName,
                role: role,
                status: 'active',
                misa_employee_code: misa_employee_code,
                misa_branch_code: misa_branch_code || "NB",
                zalo_phone: zalo_phone,
                zalo_password: zalo_password,
                zalo_backup_password: zalo_backup_password,
                login_password: password, // Lưu mật khẩu gốc để Admin xem
                updated_at: new Date().toISOString()
            });

        if (profileError) {
            console.error("Profile Update Error:", profileError);
            return NextResponse.json({ error: "Failed to set user role" }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: authData.user });

    } catch (error) {
        console.error("Admin Create User Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const supabaseAdmin = getAdminClient();
        if (!supabaseAdmin) {
            return NextResponse.json({ error: "Server Configuration Error: Missing Service Key" }, { status: 500 });
        }

        // 1. Verify Current User is Admin
        const cookieStore = cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('[API Admin Users Action] Missing Supabase env variables');
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: currentUserProfile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

        if (currentUserProfile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        // 2. Parse Request Body
        const body = await request.json();
        const { id, email, password, fullName, role, status, misa_employee_code, misa_branch_code, zalo_phone, zalo_password, zalo_backup_password } = body;

        console.log(`[Admin Update] Starting for ID: ${id}`, { fullName, role, status, misa_employee_code, misa_branch_code });

        if (!id) return NextResponse.json({ error: "Missing user ID (ID không được để trống)" }, { status: 400 });
        if (!role) return NextResponse.json({ error: "Missing role (Vai trò không được để trống)" }, { status: 400 });

        // 3. Update Auth User
        const authUpdates: any = {
            user_metadata: { full_name: fullName }
        };
        if (password && password.trim() !== "") {
            authUpdates.password = password;
        }

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates);

        if (authError) {
            console.error("Auth Update Error:", authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // 4. Update Profile
        const profileUpdate: any = {
                email: email,
                full_name: fullName,
                role: role,
                status: status,
                misa_employee_code: misa_employee_code,
                misa_branch_code: misa_branch_code,
                zalo_phone: zalo_phone,
                zalo_password: zalo_password,
                zalo_backup_password: zalo_backup_password,
                updated_at: new Date().toISOString()
        };
        // Nếu admin đổi mật khẩu, lưu mật khẩu gốc vào profiles
        if (password && password.trim() !== "") {
            profileUpdate.login_password = password;
        }
        const { data: updatedProfile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .update(profileUpdate)
            .eq("id", id)
            .select()
            .single();

        if (profileError) {
            console.error("[Admin Update] Profile DB Update Error:", profileError);
            return NextResponse.json({
                error: "Failed to update profile",
                details: profileError.message,
                code: profileError.code
            }, { status: 500 });
        }

        console.log(`[Admin Update] Success for ID: ${id}. DB Data:`, updatedProfile);

        return NextResponse.json({ success: true, user: updatedProfile });

    } catch (error: any) {
        console.error("Admin Update User Error (Exception):", error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error?.message || String(error)
        }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabaseAdmin = getAdminClient();
        if (!supabaseAdmin) {
            return NextResponse.json({ error: "Server Configuration Error: Missing Service Key" }, { status: 500 });
        }

        // 1. Verify Current User is Admin
        const cookieStore = cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('[API Admin Users Action] Missing Supabase env variables');
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: currentUserProfile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

        if (currentUserProfile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Get ID from URL
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        if (id === session.user.id) {
            return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
        }

        // 3. Delete from Auth and Profile
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            console.error("Auth Delete Error:", authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // Profile is often cascade deleted, but explicit delete is safe
        await supabaseAdmin.from("profiles").delete().eq("id", id);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Admin Delete User Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
