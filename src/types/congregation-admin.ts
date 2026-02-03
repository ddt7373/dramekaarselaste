// Congregation Statistics & Compliance Inventory Types

export interface CongregationStatistic {
    id: string;
    congregation_id: string;
    year: number;

    // Core Statistics
    baptized_members: number; // Gedoopte (non-confessing)
    confessing_members: number; // Belydende lidmate
    total_souls: number; // Auto-calculated

    // Detailed Movements (Optional)
    births?: number;
    deaths?: number;
    baptisms?: number;
    confirmations?: number;
    transfers_in?: number;
    transfers_out?: number;

    // Notes
    notes?: string;

    // Metadata
    created_by?: string;
    created_at: string;
    updated_at: string;

    // Calculated fields (from view)
    previous_year_total?: number;
    growth?: number;
    growth_percentage?: number;
}

export type InventoryFormat = 'paper' | 'electronic' | 'both';
export type InventoryCategory = 'Registers' | 'Minutes' | 'Financial' | 'Legal';

export interface CongregationInventoryItem {
    id: string;
    congregation_id: string;

    // Item Details
    item_name: string;
    item_category?: InventoryCategory;

    // Date Range
    date_from?: string;
    date_to?: string;

    // Format
    format?: InventoryFormat;

    // Compliance
    is_compliant: boolean;
    compliance_notes?: string;

    // Metadata
    created_by?: string;
    created_at: string;
    updated_at: string;
}

// Standard inventory items that should exist for every congregation
export const STANDARD_INVENTORY_ITEMS: Array<{
    name: string;
    category: InventoryCategory;
    description: string;
}> = [
        { name: 'Doopregister', category: 'Registers', description: 'Register van alle dope' },
        { name: 'Lidmaatregister', category: 'Registers', description: 'Register van alle lidmate' },
        { name: 'Belydenisregister', category: 'Registers', description: 'Register van belydenis van geloof' },
        { name: 'Huweliksregister', category: 'Registers', description: 'Register van huwelike' },
        { name: 'Begrafnisregister', category: 'Registers', description: 'Register van begrafnisse' },
        { name: 'Kerkraadnotules', category: 'Minutes', description: 'Notules van kerkraadsvergaderings' },
        { name: 'Diakensnotules', category: 'Minutes', description: 'Notules van diakensvergaderings' },
        { name: 'Finansiële State', category: 'Financial', description: 'Jaarlikse finansiële state' },
        { name: 'Bateregister', category: 'Financial', description: 'Register van gemeente bates' },
        { name: 'Bankstate', category: 'Financial', description: 'Maandelikse bankstate' },
        { name: 'Belastingdokumente', category: 'Financial', description: 'Belasting sertifikate en opgawes' },
        { name: 'Versekeringspolis', category: 'Legal', description: 'Versekeringspolis dokumente' },
        { name: 'Grondtitel', category: 'Legal', description: 'Titel dokumente van eiendom' },
        { name: 'Boutekeninge', category: 'Legal', description: 'Argitektoniese tekeninge' },
        { name: 'Kontrakte', category: 'Legal', description: 'Wettige kontrakte en ooreenkomste' }
    ];

// Helper functions
export const getFormatLabel = (format?: InventoryFormat): string => {
    const labels: Record<InventoryFormat, string> = {
        paper: 'Papier',
        electronic: 'Elektronies',
        both: 'Beide'
    };
    return format ? labels[format] : '-';
};

export const getFormatColor = (format?: InventoryFormat): string => {
    const colors: Record<InventoryFormat, string> = {
        paper: 'bg-amber-100 text-amber-800',
        electronic: 'bg-blue-100 text-blue-800',
        both: 'bg-green-100 text-green-800'
    };
    return format ? colors[format] : 'bg-gray-100 text-gray-800';
};

export const getCategoryColor = (category?: InventoryCategory): string => {
    const colors: Record<InventoryCategory, string> = {
        Registers: 'bg-purple-100 text-purple-800',
        Minutes: 'bg-blue-100 text-blue-800',
        Financial: 'bg-green-100 text-green-800',
        Legal: 'bg-red-100 text-red-800'
    };
    return category ? colors[category] : 'bg-gray-100 text-gray-800';
};

export const calculateGrowth = (current: number, previous?: number): {
    absolute: number;
    percentage: number;
} => {
    if (!previous || previous === 0) {
        return { absolute: 0, percentage: 0 };
    }
    const absolute = current - previous;
    const percentage = (absolute / previous) * 100;
    return { absolute, percentage };
};
