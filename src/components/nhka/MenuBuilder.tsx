
import React, { useState, useEffect } from 'react';
import { useNHKA } from '@/contexts/NHKAContext';
import { supabase } from '@/lib/supabase';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserRole } from '@/types/nhka';
import { toast } from 'sonner';
import { GripVertical, Plus, Trash2, Save, RotateCcw, FolderPlus, Pencil, Check, X } from 'lucide-react';
// We'll import the hardcoded list to use as a base for "Available Items" if needed, 
// but for the menu builder we mostly want to pick from the universe of known views.
// For now, I'll redefine the universe here or import from Sidebar if exported. 
// Since Sidebar's navItems isn't exported, I'll need to expose it or duplicate the definition of "All Possible Items".

// Types
type MenuItem = {
    id: string;
    label: string;
    icon?: string; // Storing icon name string for DB persistence logic
    children?: MenuItem[];
    type?: 'item' | 'category';
};

// Consolidated roles: Ouderling and Diaken share the 'groepleier' menu layout
const ROLES: UserRole[] = ['lidmaat', 'groepleier', 'admin', 'hoof_admin', 'predikant', 'moderator', 'eksterne_gebruiker', 'geloofsonderrig_admin'];

// ------------------------------------------------------------------
// Sortable Item Component
// ------------------------------------------------------------------
const SortableMenuItem = ({ item, onRemove, onEdit }: { item: MenuItem; onRemove?: () => void; onEdit?: (id: string, newLabel: string) => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const [isEditing, setIsEditing] = useState(false);
    const [editLabel, setEditLabel] = useState(item.label);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleSave = () => {
        if (onEdit && editLabel.trim()) {
            onEdit(item.id, editLabel.trim());
            setIsEditing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setIsEditing(false);
            setEditLabel(item.label);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-3 border rounded-lg mb-1 shadow-sm transition-all ${item.type === 'category' ? 'bg-[#001a35] border-[#001a35] text-white mt-4 first:mt-0' : 'bg-white border-gray-200 text-gray-700'} group`}
        >
            <div className="flex items-center gap-3 flex-1">
                <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <GripVertical className="w-4 h-4" />
                </button>

                {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                        <Input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={`h-8 text-sm ${item.type === 'category' ? 'bg-[#001a35] text-white border-blue-400' : ''}`}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking input
                        />
                        <button onClick={handleSave} className="text-green-600 hover:text-green-700 p-1 flex-shrink-0">
                            <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setIsEditing(false); setEditLabel(item.label); }} className="text-red-500 hover:text-red-600 p-1 flex-shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        {item.type === 'category' ? (
                            <span className="font-bold text-white uppercase text-xs tracking-wider">{item.label}</span>
                        ) : (
                            <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        )}

                        {onEdit && (
                            <button
                                onClick={() => { setIsEditing(true); setEditLabel(item.label); }}
                                className="text-gray-400 hover:text-[#002855] p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Pencil className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                {onRemove && !isEditing && (
                    <button onClick={onRemove} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
const MenuBuilder = () => {
    const { currentUser, gemeentes } = useNHKA();
    const [selectedRole, setSelectedRole] = useState<UserRole>('lidmaat');
    const [selectedGemeenteId, setSelectedGemeenteId] = useState<string | 'default'>('default');
    const [existingId, setExistingId] = useState<string | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAvailable, setSelectedAvailable] = useState<Set<string>>(new Set());
    const [availableItems, setAvailableItems] = useState<MenuItem[]>([
        { id: 'dashboard', label: 'Paneelbord', type: 'item' },
        { id: 'my-wyk', label: 'My Wyk / Gemeente', type: 'item' },
        { id: 'profiel', label: 'My Profiel', type: 'item' },
        { id: 'program', label: 'Gemeenteprogram', type: 'item' },
        { id: 'vrae', label: 'Vrae & Versoeke', type: 'item' },
        { id: 'admin', label: 'Administrasie', type: 'item' },
        { id: 'boodskappe', label: 'Boodskappe', type: 'item' },
        { id: 'betaling', label: 'Betalings', type: 'item' },
        { id: 'bybelkennis', label: 'Bybelkennis', type: 'item' },
        { id: 'geloofsgroei', label: 'Geloofsgroei', type: 'item' },
        { id: 'sakramentsbeloftes', label: 'Sakramentsbeloftes', type: 'item' },
        { id: 'kort-kragtig', label: 'Kort & Kragtig', type: 'item' },
        { id: 'geloofsonderrig', label: 'Geloofsonderrig', type: 'item' },
        { id: 'vbo', label: 'VBO Krediete', type: 'item' },
        { id: 'advertensies', label: 'Advertensies', type: 'item' },
        { id: 'gawes-soek', label: 'Gawes Soek', type: 'item' },
        { id: 'pastorale-aksie', label: 'Pastorale Aksies', type: 'item' },
        { id: 'missionale-bediening', label: 'Missionale Bediening', type: 'item' },
        { id: 'krisis', label: 'Krisisverslae', type: 'item' },
        { id: 'bedieningsbehoeftes', label: 'Bedieningsbehoeftes', type: 'item' },
        { id: 'kuberkermis', label: 'Kuberkermis', type: 'item' },
        { id: 'vanlyn-bestuur', label: 'Van-lyn-af Bestuur', type: 'item' },
        { id: 'hulp-tutoriale', label: 'Gebruiksaanwysings', type: 'item' },
        { id: 'dokumente', label: 'Dokumente Bestuur', type: 'item' },
        { id: 'my-dokumente', label: 'My Dokumente', type: 'item' },
        { id: 'oordrag', label: 'Lidmaatskap Oordrag', type: 'item' },
        { id: 'nuusbrief', label: 'Nuusbrief', type: 'item' },
        { id: 'erediens-info', label: 'Erediens Info', type: 'item' },
        { id: 'wyk-toewysing', label: 'Wyk Toewysing', type: 'item' },
        { id: 'besoekpunt-toewysing', label: 'Besoekpunt Toewysing', type: 'item' },
        { id: 'konsistorieboek', label: 'Konsistorieboek', type: 'item' },
        { id: 'gemeente-kaart', label: 'Gemeente Kaart', type: 'item' },
        { id: 'artikel-portaal', label: 'Artikels-portaal', type: 'item' },
        { id: 'redaksie-portaal', label: 'Redaksie-portaal', type: 'item' },
        { id: 'omsendbrief-kletsbot', label: 'Omsendbrief Kletsbot', type: 'item' },
    ]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchLayout(selectedRole, selectedGemeenteId);
    }, [selectedRole, selectedGemeenteId]);

    const fetchLayout = async (role: string, gemeenteId: string | 'default') => {
        setLoading(true);
        try {
            // 1. Try to fetch the specific layout requested
            let query = supabase
                .from('sys_menu_layouts')
                .select('*')
                .eq('role', role);

            if (gemeenteId === 'default') {
                query = query.is('gemeente_id', null);
            } else {
                query = query.eq('gemeente_id', gemeenteId);
            }

            const { data, error } = await query.maybeSingle();

            if (data) {
                // Ensure data.layout is an array. If it's a string, parse it.
                let layout = data.layout;
                if (typeof layout === 'string') {
                    try {
                        layout = JSON.parse(layout);
                    } catch (e) {
                        layout = [];
                    }
                }
                setMenuItems(Array.isArray(layout) ? layout : []);
                setExistingId(data.id || null);
            } else if (gemeenteId !== 'default') {
                // 2. Fallback: If no gemeente override exists, fetch the default role layout
                // so the user can see the starting point for their override.
                const { data: defaultData } = await supabase
                    .from('sys_menu_layouts')
                    .select('*')
                    .eq('role', role)
                    .is('gemeente_id', null)
                    .maybeSingle();

                if (defaultData) {
                    let layout = defaultData.layout;
                    if (typeof layout === 'string') {
                        try {
                            layout = JSON.parse(layout);
                        } catch (e) {
                            layout = [];
                        }
                    }
                    setMenuItems(Array.isArray(layout) ? layout : []);
                } else {
                    setMenuItems([]);
                }
                setExistingId(null);
            } else {
                setMenuItems([]);
                setExistingId(null);
            }
        } catch (error) {
            console.error('Error fetching layout:', error);
        } finally {
            setLoading(false);
        }
    };

    const addCategory = () => {
        const newCat: MenuItem = {
            id: `cat-${Date.now()}`,
            label: 'NUWE KATEGORIE',
            type: 'category'
        };
        setMenuItems(prev => [...prev, newCat]);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setMenuItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const addSelectedItems = () => {
        const itemsToAdd = availableItems.filter(item =>
            selectedAvailable.has(item.id) && !menuItems.some(m => m.id === item.id)
        );
        if (itemsToAdd.length === 0) {
            if (selectedAvailable.size > 0) toast.info('Sommige items bestaan reeds in die menu.');
            return;
        }

        setMenuItems(prev => [...prev, ...itemsToAdd.map(item => ({ ...item }))]);
        setSelectedAvailable(new Set());
        toast.success(`${itemsToAdd.length} items bygevoeg!`);
    };

    const toggleAvailableSelection = (id: string) => {
        setSelectedAvailable(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const addItemToMenu = (item: MenuItem) => {
        // Generate unique ID just in case we allow duplicates, though for menu we propably shouldn't.
        // Actually for category separators we might want dups, but for views not.
        // Let's ensure uniqueness for views.
        if (item.type === 'item' && menuItems.some(i => i.id === item.id)) {
            toast.error('Hierdie item is reeds in die menu.');
            return;
        }

        // For Categories, we generate a unique ID
        const newItem = { ...item };
        if (newItem.type === 'category') {
            newItem.id = `cat_${Date.now()}`;
        }

        setMenuItems([...menuItems, newItem]);
    };

    const removeItem = (id: string) => {
        setMenuItems(menuItems.filter(i => i.id !== id));
    };

    const updateItemLabel = (id: string, newLabel: string) => {
        setMenuItems(items => items.map(i =>
            i.id === id ? { ...i, label: newLabel } : i
        ));
    };

    const sanitizeMenu = (items: MenuItem[]): MenuItem[] => {
        return items.map(item => {
            const cleanItem: MenuItem = {
                id: item.id,
                label: item.label,
                type: item.type || 'item'
            };
            if (item.icon) cleanItem.icon = item.icon;
            if (item.children && item.children.length > 0) {
                cleanItem.children = sanitizeMenu(item.children);
            }
            return cleanItem;
        });
    };

    const saveLayout = async () => {
        try {
            // Sanitize data to ensure valid JSON
            const cleanLayout = sanitizeMenu(menuItems);

            // 2. Manual Upsert logic
            // First, find the record ID manually to be 100% sure we target the right one
            let query = supabase
                .from('sys_menu_layouts')
                .select('id')
                .eq('role', selectedRole);

            if (selectedGemeenteId === 'default') {
                query = query.is('gemeente_id', null);
            } else {
                query = query.eq('gemeente_id', selectedGemeenteId);
            }

            const { data: existingRecord } = await query.maybeSingle();

            const payload: any = {
                role: selectedRole,
                gemeente_id: selectedGemeenteId === 'default' ? null : selectedGemeenteId,
                layout: cleanLayout as any,
                updated_at: new Date().toISOString(),
                updated_by: currentUser?.id || null
            };

            if (existingRecord) {
                // Update
                const { error: updateError } = await supabase
                    .from('sys_menu_layouts')
                    .update(payload)
                    .eq('id', existingRecord.id);
                if (updateError) throw updateError;
                setExistingId(existingRecord.id);
            } else {
                // Insert
                const { data: insertData, error: insertError } = await supabase
                    .from('sys_menu_layouts')
                    .insert([payload])
                    .select('id')
                    .single();
                if (insertError) throw insertError;
                if (insertData) setExistingId(insertData.id);
            }
            toast.success(`Menu vir ${selectedRole} gestoor!`);
        } catch (e: any) {
            console.error('Save error:', e);
            toast.error('Kon nie menu stoor nie: ' + e.message);
        }
    };

    const resetToDefault = async () => {
        if (confirm('Is jy seker jy wil die menu reset? Dit sal die custom uitleg verwyder.')) {
            let query = supabase.from('sys_menu_layouts').delete().eq('role', selectedRole);

            if (selectedGemeenteId === 'default') {
                query = query.is('gemeente_id', null);
            } else {
                query = query.eq('gemeente_id', selectedGemeenteId);
            }

            const { error } = await query;
            if (!error) {
                setMenuItems([]);
                toast.success('Menu teruggestel na verstek.');
            }
        }
    };


    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#002855]">Menu Bestuurder</h1>
                    <p className="text-gray-500">Pas die navigasie aan vir verskillende gebruikersrolle</p>
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 max-w-xl">
                        <strong>Let wel:</strong> Die funksie wat heel bo aan gelys word, is die opening page wanneer &apos;n gebruiker met daardie rol inteken.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={resetToDefault}><RotateCcw className="w-4 h-4 mr-2" /> Reset</Button>
                    <Button className="bg-[#D4A84B] text-white hover:bg-[#b38e3f]" onClick={saveLayout}>
                        <Save className="w-4 h-4 mr-2" /> Stoor Veranderinge
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Role Select & Available Items */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Kies Rol om te Redigeer</label>
                        <select
                            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#002855] mb-4"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                        >
                            {ROLES.map(r => (
                                <option key={r} value={r}>
                                    {r === 'groepleier'
                                        ? 'Leier (Groepleier/Ouderling/Diaken/Kerkraad)'
                                        : r === 'admin'
                                            ? 'Administrasie (Admin/Subadmin)'
                                            : r === 'geloofsonderrig_admin'
                                                ? 'Geloofsonderrig Admin'
                                                : r.charAt(0).toUpperCase() + r.slice(1)}
                                </option>
                            ))}
                        </select>

                        <label className="block text-sm font-medium text-gray-700 mb-2">Kies Gemeente Override</label>
                        <select
                            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#002855]"
                            value={selectedGemeenteId}
                            onChange={(e) => setSelectedGemeenteId(e.target.value)}
                        >
                            <option value="default">Standaard (Vir Almal)</option>
                            {gemeentes.map(g => (
                                <option key={g.id} value={g.id}>{g.naam}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow border border-gray-100 max-h-[600px] overflow-y-auto">
                        <div className="flex flex-col gap-3 mb-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-[#002855]">Beskikbare Items</h3>
                                <Button size="sm" variant="outline" className="text-[#002855] border-[#002855] hover:bg-[#002855] hover:text-white" onClick={addCategory}>
                                    <FolderPlus className="w-4 h-4 mr-1" /> Nuwe Kategorie
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-gray-100/80 rounded-lg border border-gray-200 shadow-sm">
                                <input
                                    type="checkbox"
                                    id="select-all-available"
                                    checked={availableItems.length > 0 && selectedAvailable.size === availableItems.length}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedAvailable(new Set(availableItems.map(i => i.id)));
                                        } else {
                                            setSelectedAvailable(new Set());
                                        }
                                    }}
                                    className="w-4 h-4 rounded text-[#002855] cursor-pointer"
                                />
                                <label htmlFor="select-all-available" className="text-xs font-bold text-gray-600 cursor-pointer uppercase tracking-widest">Kies Alles</label>
                            </div>
                        </div>
                        <div className="space-y-1">
                            {availableItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`flex justify-between items-center p-2 rounded border transition-colors cursor-pointer ${selectedAvailable.has(item.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent'}`}
                                    onClick={() => toggleAvailableSelection(item.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedAvailable.has(item.id)}
                                            onChange={() => { }} // Handled by div onClick
                                            className="w-4 h-4 rounded text-[#002855]"
                                        />
                                        <span className="text-sm">{item.label}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addItemToMenu(item);
                                        }}
                                    >
                                        <Plus className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {selectedAvailable.size > 0 && (
                            <Button
                                className="w-full mt-4 bg-[#002855] text-white hover:bg-[#003d7a] animate-in slide-in-from-bottom-2"
                                onClick={addSelectedItems}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Voeg {selectedAvailable.size} geselekteerde by
                            </Button>
                        )}
                    </div>
                </div>

                {/* Right Column: Active Menu Structure */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100 min-h-[400px]">
                        <h3 className="font-semibold text-[#002855] mb-4">
                            Huidige Uitleg: {selectedRole}
                            {selectedGemeenteId !== 'default' && (
                                <span className="text-[#D4A84B]"> (Slegs vir {gemeentes.find(g => g.id === selectedGemeenteId)?.naam})</span>
                            )}
                        </h3>

                        {loading ? (
                            <div className="text-center py-10 text-gray-400">Laai menu...</div>
                        ) : menuItems.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                                <p className="text-gray-500">Geen pasgemaakte menu nie.</p>
                                <p className="text-sm text-gray-400">Die stelsel gebruik tans die standaard uitleg. Sleep items hierheen om te begin.</p>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={menuItems.map(i => i.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {menuItems.map((item) => (
                                        <SortableMenuItem
                                            key={item.id}
                                            item={item}
                                            onRemove={() => removeItem(item.id)}
                                            onEdit={updateItemLabel}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenuBuilder;
