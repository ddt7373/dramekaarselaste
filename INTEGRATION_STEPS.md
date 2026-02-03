# Stap-vir-Stap: Integreer Member Management in Admin Panel

## Stap 1: Voeg Imports by

Open: `src/components/nhka/AdminPanel.tsx`

**Voeg hierdie imports by BO-AAN die lêer** (na die bestaande imports, rondom lyn 65):

```typescript
import MemberManagement from '@/components/members/MemberManagement';
import StaffCSVImport from '@/components/members/StaffCSVImport';
```

---

## Stap 2: Voeg State Variable by

**Soek na hierdie lyn** (rondom lyn 101):
```typescript
const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'wyke' | 'wyk-toewysing' | 'gemeentes' | 'gemeente-settings' | 'betalings' | 'verhoudings'>('overview');
```

**Verander dit na:**
```typescript
const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'wyke' | 'wyk-toewysing' | 'gemeentes' | 'gemeente-settings' | 'betalings' | 'verhoudings' | 'members'>('overview');
```

**Voeg hierdie lyn by** (na die activeTab lyn):
```typescript
const [showStaffImport, setShowStaffImport] = useState(false);
```

---

## Stap 3: Voeg Member Tab by

**Soek na hierdie kode** (rondom lyn 1066-1070):
```typescript
const tabs = [
  { id: 'overview', label: 'Oorsig', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'users', label: 'Gebruikers', icon: <Users className="w-4 h-4" /> },
  { id: 'verhoudings', label: 'Verhoudings', icon: <Heart className="w-4 h-4" /> }
];
```

**Voeg hierdie lyn by BINNE die tabs array** (na die verhoudings lyn, voor die `]`):
```typescript
  { id: 'members', label: 'Lidmate', icon: <User className="w-4 h-4" /> }
```

So dit lyk nou so:
```typescript
const tabs = [
  { id: 'overview', label: 'Oorsig', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'users', label: 'Gebruikers', icon: <Users className="w-4 h-4" /> },
  { id: 'verhoudings', label: 'Verhoudings', icon: <Heart className="w-4 h-4" /> },
  { id: 'members', label: 'Lidmate', icon: <User className="w-4 h-4" /> }
];
```

---

## Stap 4: Voeg Member Management Content by

**Soek na die EINDE van die file** (rondom lyn 2800+).

**Voor die laaste `</div>` en `);` van die return statement**, voeg hierdie kode by:

```typescript
      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-[#002855]">Lidmate Bestuur</h3>
              <p className="text-sm text-gray-500">Bestuur lidmate en vul ontbrekende inligting in</p>
            </div>
            <button
              onClick={() => setShowStaffImport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#002855] rounded-lg hover:bg-[#c49a3d] transition-colors font-medium"
            >
              <Upload className="w-4 h-4" />
              Import Personeel CSV
            </button>
          </div>
          
          <MemberManagement congregationId={currentGemeente?.id || ''} />
          
          {showStaffImport && (
            <StaffCSVImport
              onClose={() => setShowStaffImport(false)}
              onComplete={() => {
                setShowStaffImport(false);
                refreshData();
              }}
            />
          )}
        </div>
      )}
```

---

## Presies Waar om Dit By te Voeg

Die lêer het hierdie strukture:

```typescript
return (
  <div className="space-y-6">
    {/* Header */}
    ...
    
    {/* Tabs */}
    ...
    
    {/* Overview Tab */}
    {activeTab === 'overview' && (...)}
    
    {/* Users Tab */}
    {activeTab === 'users' && (...)}
    
    {/* Verhoudings Tab */}
    {activeTab === 'verhoudings' && (...)}
    
    {/* Wyke Tab */}
    {activeTab === 'wyke' && (...)}
    
    {/* Gemeente Settings Tab */}
    {activeTab === 'gemeente-settings' && (...)}
    
    {/* Betalings Tab */}
    {activeTab === 'betalings' && (...)}
    
    {/* Gemeentes Tab */}
    {activeTab === 'gemeentes' && (...)}
    
    {/* ← VOEG MEMBERS TAB HIER BY ← */}
    
  </div>  {/* ← Hierdie is die laaste </div> */}
);  {/* ← Hierdie is die laaste ); */}
```

---

## Opsomming van Veranderinge

| Stap | Lyn (ongeveer) | Aksie |
|------|----------------|-------|
| 1 | ~65 | Voeg imports by |
| 2 | ~101 | Voeg 'members' by activeTab type |
| 2 | ~102 | Voeg showStaffImport state by |
| 3 | ~1069 | Voeg members tab by tabs array |
| 4 | ~2800 | Voeg members tab content by |

---

## Toets

Na jy die veranderinge gemaak het:

1. **Bou die app weer:**
   ```cmd
   npm run build
   ```

2. **Verifieer geen foute:**
   - Kyk vir TypeScript errors
   - Kyk vir build errors

3. **Test lokaal (opsioneel):**
   ```cmd
   npm run dev
   ```
   - Gaan na Admin Panel
   - Kyk of "Lidmate" tab daar is
   - Klik daarop

---

## Hulp Nodig?

As jy vashaak:
- Maak seker al 4 stappe is voltooi
- Kyk vir tikfoute
- Verifieer die imports is bo-aan
- Verifieer die tab content is voor die laaste `</div>`

---

**Gereed om te begin?** Volg die stappe een vir een! 🚀
