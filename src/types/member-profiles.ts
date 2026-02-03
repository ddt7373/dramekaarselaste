// Member Profile Types for Dramekaarselaste App
// All users are members with assigned roles

export type AppRole = 'member' | 'minister' | 'admin' | 'council' | 'treasurer' | 'organist';

export interface MemberProfile {
    id: string;
    user_id: string; // Auth user ID
    congregation_id: string;

    // Detailed Name Fields (Afrikaans naming convention)
    voorletters?: string; // Initials (e.g., "J.P.")
    first_name: string; // First name (e.g., "Johannes")
    second_name?: string; // Second name (e.g., "Petrus")
    third_name?: string; // Third name (if applicable)
    noemnaam?: string; // Preferred/nickname (e.g., "Johan")
    surname: string; // Surname (e.g., "van der Merwe")
    nooiensvan?: string; // Maiden name (for married women)

    // Contact Info (Required during onboarding)
    cellphone: string;
    email: string;

    // Extended Info (Optional - filled by admin later)
    title?: string; // Dr., Ds., Mnr., Mev., etc.
    gender?: 'man' | 'vrou' | 'ander';
    date_of_birth?: string;
    id_number?: string; // ID/Passport number

    // Address Fields
    address_street?: string;
    address_suburb?: string;
    address_city?: string;
    address_code?: string;
    address_country?: string;

    // Additional Contact
    home_phone?: string;
    work_phone?: string;
    alternative_email?: string;

    // Family Info
    marital_status?: 'ongetroud' | 'getroud' | 'geskei' | 'weduwee' | 'weduwenaar';
    spouse_name?: string;

    // Role & Portfolio
    app_roles: AppRole[]; // Array of roles
    portfolio?: string; // Specific position (e.g., "Kassier", "NHSV Voorsitter")

    // Membership Info
    membership_date?: string;
    baptism_date?: string;
    confirmation_date?: string;

    // Media
    photo_url?: string;

    // Emergency Contact
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;

    // Notes
    notes?: string;

    // Metadata
    lidmaat_status?: 'aktief' | 'oorlede' | 'verhuis' | 'bedank';
    active: boolean;
    created_at: string;
    updated_at: string;

    // Relations
    congregation?: Congregation;
}

export interface Congregation {
    id: string;
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo_url?: string;
    active: boolean;
    created_at: string;
    updated_at: string;
}

// CSV Import Types
export interface CSVStaffMember {
    name: string;
    title?: string;
    cellphone?: string;
    email?: string;
    photo_url?: string;
    roles: AppRole[];
    portfolio?: string;
}

export interface CSVCongregationRow {
    congregation_name: string;
    congregation_id?: string;
    minister?: CSVStaffMember;
    scribe?: CSVStaffMember;
    treasurer?: CSVStaffMember;
    organist?: CSVStaffMember;
    nhsv?: CSVStaffMember;
    other_staff?: CSVStaffMember[];
}

// Helper Functions
export const getRoleLabel = (role: AppRole): string => {
    const labels: Record<AppRole, string> = {
        member: 'Lidmaat',
        minister: 'Predikant',
        admin: 'Administrateur',
        council: 'Kerkraad',
        treasurer: 'Kassier',
        organist: 'Orrelis'
    };
    return labels[role] || role;
};

export const getRoleBadgeColor = (role: AppRole): string => {
    const colors: Record<AppRole, string> = {
        member: 'bg-gray-100 text-gray-800',
        minister: 'bg-purple-100 text-purple-800',
        admin: 'bg-blue-100 text-blue-800',
        council: 'bg-green-100 text-green-800',
        treasurer: 'bg-yellow-100 text-yellow-800',
        organist: 'bg-pink-100 text-pink-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
};

export const hasRole = (profile: MemberProfile, role: AppRole): boolean => {
    return profile.app_roles.includes(role);
};

export const isAdmin = (profile: MemberProfile): boolean => {
    return hasRole(profile, 'admin') || hasRole(profile, 'minister');
};

// Helper to get full name
export const getFullName = (profile: MemberProfile): string => {
    const parts = [
        profile.title,
        profile.first_name,
        profile.second_name,
        profile.third_name,
        profile.surname
    ].filter(Boolean);
    return parts.join(' ');
};

// Helper to get display name (uses noemnaam if available)
export const getDisplayName = (profile: MemberProfile): string => {
    if (profile.noemnaam) {
        return `${profile.noemnaam} ${profile.surname}`;
    }
    return `${profile.first_name} ${profile.surname}`;
};

// Helper to get initials
export const getInitials = (profile: MemberProfile): string => {
    if (profile.voorletters) {
        return profile.voorletters;
    }
    const firstInitial = profile.first_name?.charAt(0) || '';
    const surnameInitial = profile.surname?.charAt(0) || '';
    return `${firstInitial}.${surnameInitial}.`;
};
