import { createClient } from "@/lib/supabaseClient";

const supabase = createClient();

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    assignedTo?: string; // Profile UUID
}

export const loadCustomers = async (): Promise<Customer[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Telesales should see own customers. Admin sees all.
    // RLS handles this if policies set correctly.
    // However, for "create order" usage where we pick a customer:
    // If Admin: select *
    // If Telesales: select * (RLS limits)

    const { data, error } = await supabase
        .from('customers')
        .select('*');

    if (error) {
        console.error("Error loading customers:", error);
        return [];
    }

    return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        assignedTo: c.assigned_to
    }));
};

export const addCustomer = async (input: Omit<Customer, "id">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('customers')
        .insert({
            name: input.name,
            phone: input.phone,
            email: input.email,
            address: input.address,
            assigned_to: user.id
        })
        .select()
        .single();

    if (error || !data) {
        console.error("Error adding customer:", error);
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        assignedTo: data.assigned_to
    };
};
