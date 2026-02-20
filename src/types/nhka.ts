// NHKA App Types

// Added 'moderator' role for VBO management
export type UserRole = 'hoof_admin' | 'subadmin' | 'predikant' | 'groepleier' | 'lidmaat' | 'ouderling' | 'diaken' | 'admin' | 'moderator' | 'kerkraad' | 'eksterne_gebruiker' | 'geloofsonderrig_admin';

export interface Gemeente {
  id: string;
  naam: string;
  beskrywing?: string;
  adres?: string;
  telefoon?: string;
  epos?: string;
  webwerf?: string;
  logo_url?: string;
  aktief: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  sluit_uit_van_statistiek?: boolean;
}

// Gemeente Bank Besonderhede (Bank Details)
export interface GemeenteBankbesonderhede {
  id: string;
  gemeente_id: string;
  bank_naam: string;
  rekening_naam: string;
  rekening_nommer: string;
  takkode?: string;
  rekening_tipe?: string;
  verwysing_instruksies?: string;
  aktief: boolean;
  created_at: string;
  updated_at: string;
}

// Gawes en Talente (Gifts and Talents)
export interface GaweEnTalent {
  id: string;
  gebruiker_id: string;
  gemeente_id?: string;
  titel: string;
  beskrywing?: string;
  is_betaald: boolean;
  is_vrywillig: boolean;
  kontak_metode?: string;
  aktief: boolean;
  created_at: string;
  updated_at: string;
  gebruiker?: Gebruiker;
}

// Advertensie (Advertisement)
export type AdvertensieKategorie = 'besigheid' | 'diens' | 'produk' | 'fondsinsameling' | 'projek' | 'werk' | 'algemeen';

export interface Advertensie {
  id: string;
  gebruiker_id?: string;
  gemeente_id?: string;
  titel: string;
  beskrywing: string;
  kategorie: AdvertensieKategorie;
  kontak_naam?: string;
  kontak_selfoon?: string;
  kontak_epos?: string;
  prys?: string;
  plek?: string;
  foto_url?: string;
  aktief: boolean;
  verval_datum?: string;
  // Paid advertising fields
  vertoon_kere?: number;
  is_betaal?: boolean;
  betaal_status?: 'gratis' | 'hangende' | 'betaal';
  betaal_tot_datum?: string;
  yoco_checkout_id?: string;
  created_at: string;
  updated_at: string;
  gebruiker?: Gebruiker;
}


export const getAdvertensieKategorieLabel = (kategorie: AdvertensieKategorie): string => {
  const labels: Record<AdvertensieKategorie, string> = {
    besigheid: 'Besigheid',
    diens: 'Diens',
    produk: 'Produk',
    fondsinsameling: 'Fondsinsameling',
    projek: 'Gemeente Projek',
    werk: 'Werksgeleentheid',
    algemeen: 'Algemeen'
  };
  return labels[kategorie] || kategorie;
};

export interface GemeenteStats {
  gemeente_id: string;
  gemeente_naam: string;
  logo_url?: string;
  totale_lidmate: number;
  totale_wyke: number;
  totale_besoekpunte: number;
  oop_krisisse: number;
  nuwe_vrae: number;
  totale_betalings: number;
  aksies_maand: number;
}

export interface Gebruiker {
  id: string;
  naam: string;
  van: string;
  selfoon?: string;
  epos?: string;
  rol: UserRole;
  app_roles?: UserRole[];
  wyk_id?: string;
  besoekpunt_id?: string;
  gemeente_id?: string;
  adres?: string;
  geboortedatum?: string;
  ouderdom?: number;
  aktief: boolean;
  laaste_kontak?: string;
  notas?: string;
  wagwoord_hash?: string;
  epos_bevestig?: boolean;
  profile_pic_url?: string;
  popia_toestemming?: boolean;
  popia_toestemming_datum?: string;
  gemeente?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
  // Uitgebreide lidmaat velde (CSV bulk upload)
  geslag?: 'man' | 'vrou' | 'ander';
  titel?: string;
  nooiensvan?: string;
  voornaam_1?: string;
  voornaam_2?: string;
  voornaam_3?: string;
  noemnaam?: string;
  landlyn?: string;
  epos_2?: string;
  doop_datum?: string;
  belydenis_van_geloof_datum?: string;
  sterf_datum?: string;
  straat_nommer?: string;
  woonkompleks_naam?: string;
  woonkompleks_nommer?: string;
  voorstad?: string;
  stad_dorp?: string;
  poskode?: string;
  portefeulje_1?: string;
  portefeulje_2?: string;
  portefeulje_3?: string;
  is_oorlede?: boolean;
}

export interface Wyk {
  id: string;
  naam: string;
  beskrywing?: string;
  leier_id?: string;
  gemeente_id?: string;
  leier?: Gebruiker;
  lede?: Gebruiker[];
  besoekpunte?: Besoekpunt[];
  created_at: string;
  updated_at: string;
}

export interface Besoekpunt {
  id: string;
  naam: string;
  beskrywing?: string;
  adres?: string;
  wyk_id?: string;
  gemeente_id?: string;
  wyk?: Wyk;
  lede?: Gebruiker[];
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export type VerhoudingTipe = 'getroud' | 'kind' | 'ouer' | 'ander';

export interface LidmaatVerhouding {
  id: string;
  lidmaat_id: string;
  verwante_id: string;
  verhouding_tipe: VerhoudingTipe;
  verhouding_beskrywing?: string;
  gemeente_id?: string;
  lidmaat?: Gebruiker;
  verwante?: Gebruiker;
  created_at: string;
  updated_at: string;
}

// Lidmaat Oudit Log (Audit Log for Member Changes)
export type OuditAksieTipe = 'profiel_wysig' | 'wyk_toewysing' | 'besoekpunt_toewysing' | 'verhouding_bygevoeg' | 'verhouding_verwyder' | 'rol_wysig' | 'status_wysig' | 'geskep';

export interface LidmaatOuditLog {
  id: string;
  lidmaat_id: string;
  gemeente_id: string;
  aksie_tipe: OuditAksieTipe;
  beskrywing: string;
  ou_waarde?: string;
  nuwe_waarde?: string;
  gewysig_deur_id?: string;
  gewysig_deur_naam?: string;
  created_at: string;
}

export const getOuditAksieTipeLabel = (tipe: OuditAksieTipe): string => {
  const labels: Record<OuditAksieTipe, string> = {
    profiel_wysig: 'Profiel Gewysig',
    wyk_toewysing: 'Wyk Toewysing',
    besoekpunt_toewysing: 'Besoekpunt Toewysing',
    verhouding_bygevoeg: 'Verhouding Bygevoeg',
    verhouding_verwyder: 'Verhouding Verwyder',
    rol_wysig: 'Rol Gewysig',
    status_wysig: 'Status Gewysig',
    geskep: 'Lidmaat Geskep'
  };
  return labels[tipe] || tipe;
};

export type BetalingTipe = 'offergawe' | 'ander';
export type BetalingStatus = 'hangende' | 'voltooi' | 'gekanselleer' | 'misluk';

export interface Betaling {
  id: string;
  gebruiker_id?: string;
  bedrag: number;
  tipe: BetalingTipe;
  beskrywing?: string;
  status: BetalingStatus;
  betaal_datum?: string;
  yoco_checkout_id?: string;
  gemeente_id?: string;
  gebruiker?: Gebruiker;
  created_at: string;
  updated_at: string;
}

export type AksieTipe = 'besoek' | 'boodskap' | 'gebed' | 'oproep';

export interface PastoraleAksie {
  id: string;
  gebruiker_id: string;
  leier_id: string;
  tipe: AksieTipe;
  datum: string;
  nota?: string;
  gemeente_id?: string;
  created_at: string;
  gebruiker?: Gebruiker;
  leier?: Gebruiker;
}

export type KrisisTipe = 'mediese' | 'finansieel' | 'geestelik' | 'sterfgeval' | 'ander';
export type KrisisStatus = 'ingedien' | 'erken' | 'in_proses' | 'opgelos';
export type KrisisPrioriteit = 'laag' | 'normaal' | 'hoog' | 'dringend';

export interface KrisisVerslag {
  id: string;
  gebruiker_id?: string;
  ingedien_deur: string;
  tipe: KrisisTipe;
  beskrywing: string;
  prioriteit: KrisisPrioriteit;
  status: KrisisStatus;
  notas?: string;
  gemeente_id?: string;
  created_at: string;
  updated_at: string;
  gebruiker?: Gebruiker;
  ingedien_deur_gebruiker?: Gebruiker;
}

export type VraagKategorie = 'leerstellig' | 'pastoraal' | 'administratief' | 'ander';
export type VraagStatus = 'nuut' | 'in_behandeling' | 'beantwoord';

export interface Vraag {
  id: string;
  gebruiker_id: string;
  inhoud: string;
  kategorie: VraagKategorie;
  status: VraagStatus;
  antwoord?: string;
  beantwoord_deur?: string;
  gemeente_id?: string;
  created_at: string;
  updated_at: string;
  gebruiker?: Gebruiker;
}

export type ProgramTipe = 'erediens' | 'gebed' | 'jeug' | 'studie' | 'vroue' | 'mans' | 'sosiaal' | 'kategese' | 'algemeen';

export interface GemeenteProgram {
  id: string;
  titel: string;
  beskrywing?: string;
  datum: string;
  tyd?: string;
  plek?: string;
  tipe: ProgramTipe;
  gemeente_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Erediens Inligting (Sunday Service Information)
export interface EreidiensInfo {
  id: string;
  gemeente_id: string;
  sondag_datum: string;
  tema?: string;
  skriflesing?: string;
  preek_opsomming?: string;
  dagstukkies?: Dagstukkie[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Dagstukkie {
  id: string;
  erediens_id: string;
  dag: string; // 'Maandag', 'Dinsdag', etc.
  titel: string;
  inhoud: string;
  skrifverwysing?: string;
  created_at: string;
}

// Nuusbrief (Newsletter)
export interface Nuusbrief {
  id: string;
  gemeente_id: string;
  titel: string;
  inhoud: string;
  gestuur_op?: string;
  ontvangers_aantal?: number;
  created_by?: string;
  created_at: string;
}

// Dokument Kategorie (Custom Document Category)
export interface DokumentKategorieCustom {
  id: string;
  gemeente_id: string;
  naam: string;
  beskrywing?: string;
  ikoon?: string;
  aktief: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Dokument (Document)
export type DokumentKategorie = 'doopsertifikaat' | 'lidmaatskap' | 'grondwet' | 'beleid' | 'verslag' | 'algemeen' | string;

export interface Dokument {
  id: string;
  gemeente_id: string;
  lidmaat_id?: string;
  lidmaat_naam?: string;
  titel: string;
  beskrywing?: string;
  kategorie: DokumentKategorie;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  is_publiek: boolean;
  opgelaai_deur?: string;
  created_at: string;
  updated_at: string;
}

// Default categories that are always available
export const DEFAULT_DOKUMENT_KATEGORIEE: { value: DokumentKategorie; label: string }[] = [
  { value: 'doopsertifikaat', label: 'Doopsertifikaat' },
  { value: 'lidmaatskap', label: 'Lidmaatskap Bewys' },
  { value: 'grondwet', label: 'Gemeente Grondwet' },
  { value: 'beleid', label: 'Beleidsdokument' },
  { value: 'verslag', label: 'Verslag' },
  { value: 'algemeen', label: 'Algemeen' }
];

export const getDokumentKategorieLabel = (kategorie: DokumentKategorie, customKategoriee?: DokumentKategorieCustom[]): string => {
  const defaultLabels: Record<string, string> = {
    doopsertifikaat: 'Doopsertifikaat',
    lidmaatskap: 'Lidmaatskap Bewys',
    grondwet: 'Gemeente Grondwet',
    beleid: 'Beleidsdokument',
    verslag: 'Verslag',
    algemeen: 'Algemeen'
  };

  // Check default labels first
  if (defaultLabels[kategorie]) {
    return defaultLabels[kategorie];
  }

  // Check custom categories
  if (customKategoriee) {
    const custom = customKategoriee.find(k => k.id === kategorie || k.naam.toLowerCase() === kategorie.toLowerCase());
    if (custom) {
      return custom.naam;
    }
  }

  return kategorie;
};

// Oordrag (Transfer) Types
export type OordragTipe = 'gemeente' | 'ander_kerk';
export type OordragStatus = 'hangende' | 'goedgekeur' | 'afgekeur' | 'voltooi';

export interface OordragVersoek {
  id: string;
  gemeente_id: string;
  lidmaat_id: string;
  oordrag_tipe: OordragTipe;
  bestemming_gemeente_id?: string;
  bestemming_gemeente_naam?: string;
  ander_kerk_naam?: string;
  ander_kerk_adres?: string;
  rede?: string;
  status: OordragStatus;
  admin_notas?: string;
  verwerk_deur?: string;
  verwerk_datum?: string;
  created_at: string;
  updated_at: string;
  lidmaat?: Gebruiker;
}

export const getOordragTipeLabel = (tipe: OordragTipe): string => {
  const labels: Record<OordragTipe, string> = {
    gemeente: 'Oordrag na Ander NHKA Gemeente',
    ander_kerk: 'Oordrag na Ander Kerk'
  };
  return labels[tipe] || tipe;
};

export const getOordragStatusLabel = (status: OordragStatus): string => {
  const labels: Record<OordragStatus, string> = {
    hangende: 'Hangende',
    goedgekeur: 'Goedgekeur',
    afgekeur: 'Afgekeur',
    voltooi: 'Voltooi'
  };
  return labels[status] || status;
};

// ==========================================
// VBO (Voortgesette Bedieningsopleiding) Types
// ==========================================

export type VBOAktiwiteitTipe = 'kursus' | 'konferensie' | 'werkwinkel' | 'mentorskap' | 'navorsing' | 'publikasie' | 'ander';
export type VBOIndieningStatus = 'hangende' | 'goedgekeur' | 'afgekeur';

export interface VBOAktiwiteit {
  id: string;
  titel: string;
  beskrywing: string;
  tipe: VBOAktiwiteitTipe;
  krediete: number;
  kursus_id?: string; // Link to LMS course if applicable
  bewyse_verplig: boolean;
  aktief: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface VBOIndiening {
  id: string;
  predikant_id: string;
  aktiwiteit_id: string;
  aktiwiteit?: VBOAktiwiteit;
  predikant?: Gebruiker;
  bewys_url?: string;
  bewys_naam?: string;
  notas?: string;
  status: VBOIndieningStatus;
  moderator_id?: string;
  moderator_notas?: string;
  goedgekeur_op?: string;
  created_at: string;
  updated_at: string;
}

export interface VBOKredietOpsomming {
  predikant_id: string;
  totale_krediete: number;
  goedgekeurde_indienings: number;
  hangende_indienings: number;
}

export interface VBOHistoriesePunte {
  id: string;
  predikant_id?: string | null;
  csv_naam?: string;
  csv_van?: string;
  jaar: number;
  punte: number;
  beskrywing?: string;
  created_at: string;
  predikant?: Gebruiker;
}

export const getVBOAktiwiteitTipeLabel = (tipe: VBOAktiwiteitTipe): string => {
  const labels: Record<VBOAktiwiteitTipe, string> = {
    kursus: 'LMS Kursus',
    konferensie: 'Konferensie',
    werkwinkel: 'Werkwinkel',
    mentorskap: 'Mentorskap',
    navorsing: 'Navorsing',
    publikasie: 'Publikasie',
    ander: 'Ander'
  };
  return labels[tipe] || tipe;
};

export const getVBOIndieningStatusLabel = (status: VBOIndieningStatus): string => {
  const labels: Record<VBOIndieningStatus, string> = {
    hangende: 'Hangende',
    goedgekeur: 'Goedgekeur',
    afgekeur: 'Afgekeur'
  };
  return labels[status] || status;
};

// Check if user is a moderator (can manage VBO)
export const isModerator = (rol: UserRole): boolean => {
  return rol === 'moderator' || rol === 'hoof_admin';
};

// Check if user is a predikant (can access VBO)
export const isPredikant = (rol: UserRole): boolean => {
  return rol === 'predikant';
};

// Check if user is a restricted leader (can only see their ward)
export const isRestrictedLeader = (rol: UserRole): boolean => {
  return ['ouderling', 'diaken', 'kerkraad', 'groepleier'].includes(rol);
};

// ==========================================
// Bedieningsbehoeftes (Ministry Needs) Types
// ==========================================

export type BedieningsbehoefteTipe = 'preekbeurt' | 'hospitaalbesoek' | 'krisispastoraat' | 'ander';
export type BedieningsbehoefeStatus = 'oop' | 'gevul' | 'gekanselleer';

export interface Bedieningsbehoefte {
  id: string;
  gemeente_id: string;
  aanmelder_id: string;
  aanmelder_naam: string;
  gemeente_naam: string;
  tipe: BedieningsbehoefteTipe;
  ander_beskrywing?: string;
  beskrywing: string;
  datum: string;
  tyd: string;
  plek: string;
  kontaknommer: string; // Required contact number for WhatsApp
  status: BedieningsbehoefeStatus;
  vervuller_id?: string;
  vervuller_naam?: string;
  vervuller_kontaknommer?: string; // Contact number of person who will fulfill
  vervul_datum?: string;
  created_at: string;
  updated_at: string;
}


export interface BedieningsbehoefeRegistrasie {
  id: string;
  predikant_id: string;
  predikant_naam: string;
  predikant_email?: string;
  gemeente_id: string;
  gemeente_naam: string;
  ontvang_kennisgewings: boolean;
  created_at: string;
}

export const getBedieningsbehoefteTipeLabel = (tipe: BedieningsbehoefteTipe): string => {
  const labels: Record<BedieningsbehoefteTipe, string> = {
    preekbeurt: 'Preekbeurt',
    hospitaalbesoek: 'Hospitaalbesoek',
    krisispastoraat: 'Krisispastoraat',
    ander: 'Ander'
  };
  return labels[tipe] || tipe;
};

export const getBedieningsbehoefeStatusLabel = (status: BedieningsbehoefeStatus): string => {
  const labels: Record<BedieningsbehoefeStatus, string> = {
    oop: 'Oop',
    gevul: 'Gevul',
    gekanselleer: 'Gekanselleer'
  };
  return labels[status] || status;
};

// ==========================================
// View types
// ==========================================


// ==========================================
// Boodskappe (Internal Messaging) Types
// ==========================================

export type GroepTipe = 'wyk' | 'besoekpunt' | 'rol' | 'almal';

export interface Boodskap {
  id: string;
  sender_id: string;
  sender_naam: string;
  onderwerp: string;
  inhoud: string;
  gemeente_id?: string;
  is_groep_boodskap: boolean;
  groep_tipe?: GroepTipe;
  groep_id?: string;
  groep_rol?: string;
  created_at: string;
}

export interface BoodskapOntvanger {
  id: string;
  boodskap_id: string;
  ontvanger_id: string;
  ontvanger_naam: string;
  gelees_op?: string;
  verwyder_op?: string;
  created_at: string;
  boodskap?: Boodskap;
}

export const getGroepTipeLabel = (tipe: GroepTipe): string => {
  const labels: Record<GroepTipe, string> = {
    wyk: 'Wyk',
    besoekpunt: 'Besoekpunt',
    rol: 'Rol',
    almal: 'Alle Lidmate'
  };
  return labels[tipe] || tipe;
};

// ==========================================
// View types
// ==========================================



export type AppView =
  | 'dashboard'
  | 'my-wyk'
  | 'profiel'
  | 'pastorale-aksie'
  | 'krisis'
  | 'program'
  | 'vrae'
  | 'admin'
  | 'login'
  | 'gemeente-select'
  | 'register'
  | 'gemeente-register'
  | 'betaling'
  | 'verhoudings'
  | 'wagwoord-herstel'
  | 'hoof-admin-dashboard'
  | 'moderator-dashboard'
  | 'erediens-info'
  | 'nuusbrief'
  | 'dokumente'
  | 'my-dokumente'
  | 'oordrag'
  | 'wyk-toewysing'
  | 'besoekpunt-toewysing'
  | 'advertensies'
  | 'gawes-soek'
  | 'geloofsgroei'
  | 'lms-bestuur'
  | 'vbo'
  | 'bedieningsbehoeftes'
  | 'gemeente-kaart'
  | 'denominasie-kaart'
  | 'rol-bestuur'
  | 'vanlyn-bestuur'
  | 'sakramentsbeloftes'
  | 'missionale-bediening'
  | 'geloofsonderrig'
  | 'boodskappe'
  | 'my-sertifikate'
  | 'notification-preferences'
  | 'kuberkermis'
  | 'hulp-tutoriale'
  | 'kort-kragtig'
  | 'kort-kragtig-admin'
  | 'konsistorieboek'
  | 'bybelkennis'
  | 'artikel-portaal'
  | 'redaksie-portaal'
  | 'krisis-bestuur'
  | 'omsendbrief-kletsbot'
  | 'musiek'
  | 'musiek-admin';



// ==========================================
// Konsistorieboek (Consistory Book) Types
// ==========================================

export type ErediensTipe = 'oggend' | 'aand' | 'spesiaal';
export type KonsistorieBesluitStatus = 'aanvaar' | 'verwerp' | 'uitgestel';
export type AfkondigingKategorie = 'algemeen' | 'sterfgeval' | 'geboorte' | 'huwelik' | 'doop' | 'belydenis';
export type LidmaatskapKennisgwingTipe = 'nuwe_lidmaat' | 'oordrag_in' | 'oordrag_uit' | 'oorlede' | 'gedoop' | 'belydenis';

export interface ErediensBywoning {
  id: string;
  gemeente_id: string;
  erediens_datum: string;
  erediens_tyd?: string;
  erediens_tipe: ErediensTipe;
  tema?: string;
  skriflesing?: string;
  prediker_naam?: string;
  totale_bywoning: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  bywoning_rekords?: BywoningRekord[];
}

export interface BywoningRekord {
  id: string;
  erediens_bywoning_id: string;
  gebruiker_id?: string;
  naam: string;
  rol?: string;
  handtekening_data?: string; // Base64 signature for kerkraad
  is_kerkraad: boolean;
  kommentaar?: string;
  created_at: string;
}

export interface KonsistorieBesluit {
  id: string;
  gemeente_id: string;
  vergadering_datum: string;
  vergadering_nommer?: string;
  besluit_nommer?: string;
  onderwerp: string;
  beskrywing?: string;
  besluit: string;
  voorsteller?: string;
  sekondant?: string;
  status: KonsistorieBesluitStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface KollekteRekord {
  id: string;
  gemeente_id: string;
  erediens_datum: string;
  erediens_tipe: ErediensTipe;
  deurkollekte_bedrag: number;
  nagmaal_kollekte_bedrag: number;
  kategese_kollekte_bedrag: number;
  ander_kollekte_bedrag: number;
  ander_kollekte_beskrywing?: string;
  getel_deur_naam?: string;
  getel_deur_handtekening?: string; // Base64 signature
  kassier_kwitansie_nommer?: string;
  notas?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface GemeenteAfkondiging {
  id: string;
  gemeente_id: string;
  erediens_datum: string;
  titel: string;
  inhoud: string;
  kategorie: AfkondigingKategorie;
  is_dringend: boolean;
  geldig_tot?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LidmaatskapKennisgewing {
  id: string;
  gemeente_id: string;
  datum: string;
  tipe: LidmaatskapKennisgwingTipe;
  lidmaat_naam: string;
  lidmaat_id?: string;
  beskrywing?: string;
  van_gemeente?: string;
  na_gemeente?: string;
  dokument_verwysing?: string;
  created_by?: string;
  created_at: string;
}

export const getErediensTipeLabel = (tipe: ErediensTipe): string => {
  const labels: Record<ErediensTipe, string> = {
    oggend: 'Oggenddiens',
    aand: 'Aanddiens',
    spesiaal: 'Spesiale Diens'
  };
  return labels[tipe] || tipe;
};

export const getKonsistorieBesluitStatusLabel = (status: KonsistorieBesluitStatus): string => {
  const labels: Record<KonsistorieBesluitStatus, string> = {
    aanvaar: 'Aanvaar',
    verwerp: 'Verwerp',
    uitgestel: 'Uitgestel'
  };
  return labels[status] || status;
};

export const getAfkondigingKategorieLabel = (kategorie: AfkondigingKategorie): string => {
  const labels: Record<AfkondigingKategorie, string> = {
    algemeen: 'Algemeen',
    sterfgeval: 'Sterfgeval',
    geboorte: 'Geboorte',
    huwelik: 'Huwelik',
    doop: 'Doop',
    belydenis: 'Belydenis'
  };
  return labels[kategorie] || kategorie;
};

export const getLidmaatskapKennisgwingTipeLabel = (tipe: LidmaatskapKennisgwingTipe): string => {
  const labels: Record<LidmaatskapKennisgwingTipe, string> = {
    nuwe_lidmaat: 'Nuwe Lidmaat',
    oordrag_in: 'Oordrag Inkom',
    oordrag_uit: 'Oordrag Uitgaan',
    oorlede: 'Oorlede',
    gedoop: 'Gedoop',
    belydenis: 'Belydenis Afgelê'
  };
  return labels[tipe] || tipe;
};

// Check if user can manage Konsistorieboek
export const canManageKonsistorieboek = (rol: UserRole): boolean => {
  return ['hoof_admin', 'subadmin', 'admin', 'predikant'].includes(rol);
};



// ==========================================
// Kort & Kragtig (Micro-Learning) Types
// ==========================================

export type KKLessonStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type KKVariantType = 'SHORT' | 'STANDARD' | 'EXTENDED' | 'REMEDIAL';
export type KKBlockType = 'HOOK' | 'STORY' | 'EXPLANATION' | 'INTERACTIVE' | 'REFLECTION' | 'REWARD';
export type KKQuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'DRAG_DROP' | 'FILL_BLANK' | 'REFLECTION';
export type KKSkillTag = 'Feite' | 'Begrip' | 'Toepassing' | 'Vers';
export type KKThemeTag = 'Stories' | 'Jesus' | 'Wysheid' | 'Gebed' | 'Vrug van die Gees' | 'Liefde' | 'God';

export interface KKLesson {
  id: string;
  title: string;
  passage_reference?: string;
  theme_tags: string[];
  age_band: string;
  difficulty: number;
  summary?: string;
  core_truths: string[];
  glossary?: { term: string; definition: string }[];
  created_by?: string;
  status: KKLessonStatus;
  created_at: string;
  updated_at: string;
  variants?: KKLessonVariant[];
  questions?: KKQuestion[];
}

export interface KKLessonVariant {
  id: string;
  lesson_id: string;
  variant_type: KKVariantType;
  hook_text?: string;
  story_text?: string;
  explanation_points: string[];
  parent_prompt?: string;
  created_at: string;
  updated_at: string;
}

export interface KKLessonBlock {
  id: string;
  variant_id: string;
  block_type: KKBlockType;
  block_order: number;
  content: Record<string, any>;
  duration_seconds: number;
  created_at: string;
}

export interface KKQuestion {
  id: string;
  lesson_id: string;
  variant_type: string;
  question_type: KKQuestionType;
  question_text: string;
  options: string[];
  correct_answer?: string;
  correct_answers: string[];
  skill_tag: KKSkillTag;
  difficulty: number;
  hint_text?: string;
  explanation?: string;
  created_at: string;
}

export interface KKUserProgress {
  id: string;
  user_id: string;
  total_lessons_completed: number;
  total_time_spent_seconds: number;
  current_streak: number;
  longest_streak: number;
  last_lesson_date?: string;
  average_score: number;
  skill_scores: Record<KKSkillTag, number>;
  badges_earned: string[];
  created_at: string;
  updated_at: string;
}

export interface KKLessonAttempt {
  id: string;
  user_id: string;
  lesson_id: string;
  variant_type: KKVariantType;
  time_selected: number;
  challenge_mode: boolean;
  score_percent: number;
  hints_used: number;
  time_spent_seconds: number;
  questions_answered: number;
  questions_correct: number;
  skill_breakdown: Record<string, number>;
  completed_at: string;
  created_at: string;
  lesson?: KKLesson;
}

export const getKKVariantLabel = (variant: KKVariantType): string => {
  const labels: Record<KKVariantType, string> = {
    SHORT: 'Kort (3 min)',
    STANDARD: 'Standaard (5 min)',
    EXTENDED: 'Uitgebrei (10 min)',
    REMEDIAL: 'Hersienings'
  };
  return labels[variant] || variant;
};

export const getKKThemeLabel = (theme: string): string => {
  const labels: Record<string, string> = {
    'Stories': 'Stories',
    'Jesus': 'Jesus',
    'Wysheid': 'Wysheid',
    'Gebed': 'Gebed',
    'Vrug van die Gees': 'Vrug van die Gees',
    'Liefde': 'Liefde',
    'God': 'God'
  };
  return labels[theme] || theme;
};

export const getKKSkillLabel = (skill: KKSkillTag): string => {
  const labels: Record<KKSkillTag, string> = {
    'Feite': 'Feite Onthou',
    'Begrip': 'Begrip',
    'Toepassing': 'Toepassing',
    'Vers': 'Skrifvers'
  };
  return labels[skill] || skill;
};




// ==========================================
// Kuberkermis (Cyber Fair) Types
// ==========================================

export type KuberkermisKategorie = 'kos' | 'gebak' | 'handwerk' | 'kaartjies' | 'dienste' | 'algemeen';

export interface KuberkermisProdukt {
  id: string;
  gemeente_id: string;
  titel: string;
  beskrywing?: string;
  prys: number;
  kategorie: KuberkermisKategorie;
  foto_url?: string;
  voorraad: number; // -1 means unlimited
  aktief: boolean;
  is_kaartjie: boolean;
  /** When set, this product is an LMS course voucher; purchase generates codes for this course */
  lms_kursus_id?: string | null;
  geskep_deur?: string;
  created_at: string;
  updated_at: string;
}

export interface KuberkermisKaartjieNommer {
  id: string;
  produk_id: string;
  nommer: string;
  bestelling_id?: string;
  bestelling?: KuberkermisBestelling;
  is_verkoop: boolean;
  created_at: string;
  updated_at: string;
}

export interface KuberkermisBestelling {
  id: string;
  gemeente_id: string;
  produk_id: string;
  produk?: KuberkermisProdukt;
  koper_naam: string;
  koper_selfoon: string;
  koper_epos?: string;
  hoeveelheid: number;
  totaal_bedrag: number;
  betaal_status: 'hangende' | 'betaal' | 'gekanselleer';
  yoco_checkout_id?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
  kaartjies?: KuberkermisKaartjieNommer[];
}

export const getKuberkermisKategorieLabel = (kategorie: KuberkermisKategorie): string => {
  const labels: Record<KuberkermisKategorie, string> = {
    kos: 'Kos & Lekkernye',
    gebak: 'Gebak & Koeke',
    handwerk: 'Handwerk',
    kaartjies: 'Kaartjies & Toegang',
    dienste: 'Dienste',
    algemeen: 'Algemeen'
  };
  return labels[kategorie] || kategorie;
};













// Helper functions
export const getRolLabel = (rol: UserRole): string => {
  const labels: Record<string, string> = {
    hoof_admin: 'Hoof Administrateur',
    subadmin: 'Gemeente Administrateur',
    predikant: 'Predikant/Gemeenteleier',
    groepleier: 'Groepleier',
    lidmaat: 'Lidmaat',
    ouderling: 'Ouderling',
    diaken: 'Diaken',
    admin: 'Administrateur',
    moderator: 'VBO Moderator'
  };
  return labels[rol] || rol;
};

export const getAksieLabel = (tipe: AksieTipe): string => {
  const labels: Record<AksieTipe, string> = {
    besoek: 'Huisbesoek',
    boodskap: 'Boodskap',
    gebed: 'Gebed',
    oproep: 'Telefoonoproep'
  };
  return labels[tipe];
};

export const getKrisisTipeLabel = (tipe: KrisisTipe): string => {
  const labels: Record<KrisisTipe, string> = {
    mediese: 'Mediese Nood',
    finansieel: 'Finansiële Nood',
    geestelik: 'Geestelike Nood',
    sterfgeval: 'Sterfgeval',
    ander: 'Ander'
  };
  return labels[tipe];
};

export const getKrisisStatusLabel = (status: KrisisStatus): string => {
  const labels: Record<KrisisStatus, string> = {
    ingedien: 'Ingedien',
    erken: 'Erken',
    in_proses: 'In Proses',
    opgelos: 'Opgelos'
  };
  return labels[status];
};

export const getVraagKategorieLabel = (kategorie: VraagKategorie): string => {
  const labels: Record<VraagKategorie, string> = {
    leerstellig: 'Leerstellig',
    pastoraal: 'Pastoraal',
    administratief: 'Administratief',
    ander: 'Ander'
  };
  return labels[kategorie];
};

export const getVraagStatusLabel = (status: VraagStatus): string => {
  const labels: Record<VraagStatus, string> = {
    nuut: 'Nuut',
    in_behandeling: 'In Behandeling',
    beantwoord: 'Beantwoord'
  };
  return labels[status];
};

export const getProgramTipeLabel = (tipe: ProgramTipe): string => {
  const labels: Record<ProgramTipe, string> = {
    erediens: 'Erediens',
    gebed: 'Gebedsdiens',
    jeug: 'Jeugbyeenkoms',
    studie: 'Bybelstudie',
    vroue: 'Vrouebyeenkoms',
    mans: 'Mansbyeenkoms',
    sosiaal: 'Sosiale Geleentheid',
    kategese: 'Kategese',
    algemeen: 'Algemeen'
  };
  return labels[tipe];
};

export const getVerhoudingLabel = (tipe: VerhoudingTipe): string => {
  const labels: Record<VerhoudingTipe, string> = {
    getroud: 'Getroud met',
    kind: 'Kind van',
    ouer: 'Ouer van',
    ander: 'Ander'
  };
  return labels[tipe];
};

export const getBetalingTipeLabel = (tipe: BetalingTipe): string => {
  const labels: Record<BetalingTipe, string> = {
    offergawe: 'Offergawe',
    ander: 'Ander'
  };
  return labels[tipe];
};

export const getBetalingStatusLabel = (status: BetalingStatus): string => {
  const labels: Record<BetalingStatus, string> = {
    hangende: 'Hangende',
    voltooi: 'Voltooi',
    gekanselleer: 'Gekanselleer',
    misluk: 'Misluk'
  };
  return labels[status];
};

export const isLeier = (rol: UserRole): boolean => {
  return ['hoof_admin', 'subadmin', 'predikant', 'groepleier', 'ouderling', 'diaken', 'admin', 'moderator'].includes(rol);
};

export const isAdmin = (rol: UserRole): boolean => {
  return ['hoof_admin', 'subadmin', 'admin'].includes(rol);
};

// Check if user can answer questions (vrae) - includes kerkraad members
export const canAnswerVrae = (rol: UserRole): boolean => {
  return ['hoof_admin', 'subadmin', 'admin', 'predikant', 'ouderling', 'diaken'].includes(rol);
};

// Check if user is a wyk leader (ouderling, diaken, groepleier)
export const isWykLeier = (rol: UserRole): boolean => {
  return ['ouderling', 'diaken', 'groepleier'].includes(rol);
};

// Hoof Admin is above all gemeentes - they don't belong to a specific gemeente
export const isHoofAdmin = (rol: UserRole): boolean => {
  return rol === 'hoof_admin';
};

// Gemeente Admin is tied to a specific gemeente
export const isGemeenteAdmin = (rol: UserRole): boolean => {
  return ['subadmin', 'admin'].includes(rol);
};

export const canEditGemeenteLogo = (rol: UserRole): boolean => {
  return ['hoof_admin', 'subadmin', 'admin', 'predikant'].includes(rol);
};

export const canManageWyke = (rol: UserRole): boolean => {
  return ['hoof_admin', 'subadmin', 'admin', 'predikant'].includes(rol);
};

// Check if user can add hoof admins (only hoof_admin can)
export const canAddHoofAdmin = (rol: UserRole): boolean => {
  return rol === 'hoof_admin';
};

// Check if user can create moderators (only hoof_admin can)
export const canCreateModerator = (rol: UserRole): boolean => {
  return rol === 'hoof_admin';
};
// ==========================================
// LMS (Learning Management System) Types
// ==========================================

export interface LMSBylae {
  titel: string;
  url: string;
  tipe: string;
  grootte: number;
}

export interface LMSKursus {
  id: string;
  titel: string;
  beskrywing?: string;
  kort_beskrywing?: string;
  kategorie: string;
  vlak: string;
  prys: number;
  is_gratis: boolean;
  duur_minute: number;
  foto_url?: string;
  video_voorskou_url?: string;
  is_gepubliseer: boolean;
  is_aktief: boolean;
  vereistes?: string;
  wat_jy_sal_leer?: string[];
  geskep_deur?: string;
  is_vbo_geskik?: boolean;
  vbo_krediete?: number;
  is_missionaal?: boolean;
  created_at: string;
  updated_at: string;
  modules?: LMSModule[];
}

export interface LMSModule {
  id: string;
  kursus_id: string;
  titel: string;
  beskrywing?: string;
  volgorde: number;
  is_aktief: boolean;
  lesse?: LMSLes[];
  created_at?: string;
  updated_at?: string;
}

export interface LMSLes {
  id: string;
  module_id: string;
  kursus_id: string;
  titel: string;
  tipe: 'video' | 'teks' | 'toets' | 'eksamen' | 'opdrag';
  inhoud?: string;
  video_url?: string;
  duur_minute: number;
  volgorde: number;
  is_aktief: boolean;
  slaag_persentasie: number;
  maksimum_punte?: number;
  bylaes?: LMSBylae[]; // Array of file objects or links
  questions?: LMSQuestion[]; // optional, fetched for quizzes
  created_at?: string;
  updated_at?: string;
}

export interface LMSQuestion {
  id: string;
  les_id: string;
  vraag_teks: string;
  vraag_tipe: 'mcq' | 'true_false' | 'text';
  opsies?: any; // Changed from string[] to any to handle JSON wrapper workaround // Array of strings for MCQ
  korrekte_antwoord?: string; // For auto-grading
  punte: number;
  volgorde: number;
  created_at: string;
  updated_at: string;
}

export interface LMSSubmission {
  id: string;
  les_id: string;
  gebruiker_id: string;
  teks_antwoord?: string;
  leernaam?: string;
  leer_url?: string;
  status: 'ingedien' | 'gemerk' | 'teruggestuur';
  punt?: number;
  maksimum_punte?: number;
  terugvoer?: string;
  ingedien_op: string;
  gemerk_op?: string;
  gemerk_deur?: string;
  gebruiker?: Gebruiker; // Joined user info
}

export interface LMSQuizAttempt {
  id: string;
  les_id: string;
  gebruiker_id: string;
  telling: number;
  maksimum_punte: number;
  persentasie: number;
  geslaag: boolean;
  antwoorde: Record<string, string>; // Map question_id to answer
  voltooi_op: string;
}

export interface LMSRegistrasie {
  id: string;
  gebruiker_id: string;
  kursus_id: string;
  status: 'geregistreer' | 'hangende' | 'voltooi';
  betaling_status: 'gratis' | 'hangende' | 'betaal';
  betaling_bedrag: number;
  begin_datum: string;
  completed_at?: string;
  kursus?: LMSKursus;
}

export interface LMSVordering {
  id: string;
  gebruiker_id: string;
  kursus_id: string;
  les_id: string;
  status: 'begin' | 'voltooi';
  toets_telling?: number;
  toets_maksimum?: number;
  toets_geslaag?: boolean;
  last_accessed_at?: string;
  updated_at?: string;
  video_posisie?: number;
  antwoorde?: Record<string, string>; // For legacy or detailed tracking
}

// ==========================================
// Geloofsonderrig (Faith Education) Types
// ==========================================

export interface Graad {
  id: string;
  naam: string;
  volgorde: number;
  aktief: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeloofsonderrigOnderwerp {
  id: string;
  titel: string;
  beskrywing: string;
  ikoon: string;
  kleur: string;
  volgorde: number;
  graad_id?: string;
  aktief: boolean;
}

export interface GeloofsonderrigLes {
  id: string;
  onderwerp_id: string;
  titel: string;
  inhoud: string;
  skrifverwysing: string;
  video_url?: string;
  file_url?: string;
  file_type?: string;
  file_name?: string;
  volgorde: number;
  aktief?: boolean;
}

export interface GeloofsonderrigVraag {
  id: string;
  les_id: string;
  vraag_teks: string;
  vraag_tipe: 'open' | 'multiple_choice' | 'true_false';
  opsies: string[] | null;
  korrekte_antwoord: string | null;
  is_ki_gegenereer: boolean;
  volgorde: number;
}

export interface GeloofsonderrigKlas {
  id: string;
  mentor_id: string;
  gemeente_id: string;
  graad_id?: string;
  naam: string;
  beskrywing: string;
  kode: string;
  aktief: boolean;
  leerder_count?: number;
}

export interface GeloofsonderrigKlasLeerder {
  id: string;
  klas_id: string;
  leerder_id: string;
  joined_at: string;
  leerder?: {
    id: string;
    naam: string;
    van: string;
    selfoon?: string;
    epos?: string;
  };
}

export interface GeloofsonderrigVordering {
  id: string;
  leerder_id: string;
  onderwerp_id: string;
  les_id: string;
  voltooi: boolean;
  persentasie: number;
}

export interface GeloofsonderrigPrent {
  id: string;
  leerder_id: string;
  prompt: string;
  prent_url: string;
  created_at: string;
}

export interface LesVisualisering {
  id: string;
  lesId: string;
  imageUrl: string;
  prompt: string;
  betekenis?: string;
  includeNaam?: boolean;
  createdAt: Date;
  isAiGenerated?: boolean;
}

export type GeneratedImage = GeloofsonderrigPrent;

// ==========================================
// Artikels Portaal Types
// ==========================================

export interface ArtikelTipe {
  id: string;
  naam: string;
  maks_woorde: number | null;
  aktief: boolean;
  created_at: string;
}

export interface ArtikelIndiening {
  id: string;
  gebruiker_id: string;
  tipe_id: string;
  titel: string;
  inhoud: string;
  woord_telling: number;
  status: 'ingedien' | 'in_hersiening' | 'gepubliseer' | 'afgewys';
  created_at: string;
  updated_at: string;
  gebruiker?: Gebruiker;
  artikel_tipe?: ArtikelTipe;
}

/** Bereken ouderdom uit geboortedatum (fallback as DB ouderdom nie beskikbaar nie) */
export function getOuderdom(geboortedatum?: string | null, dbOuderdom?: number | null): number | null {
  if (dbOuderdom != null) return dbOuderdom;
  if (!geboortedatum) return null;
  const today = new Date();
  const birth = new Date(geboortedatum);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/** Vertoon naam vir lidmate: noemnaam + van (of naam + van as noemnaam nie bestaan nie) */
export function getLidmaatDisplayNaam(gebruiker: { naam: string; van: string; noemnaam?: string | null }): string {
  const voornaam = gebruiker.noemnaam?.trim() || gebruiker.naam?.trim() || '';
  return `${voornaam} ${gebruiker.van || ''}`.trim();
}

/** Haal numeriese volgorde uit wyk naam vir sortering (Wyk 1, Wyk 9, Wyk 10 → 1, 9, 10) */
export function getWykSortKey(wyk: { naam: string }): number {
  const match = wyk.naam.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
}

/** Sorteer wyke numeries (9, 10, 11, 12 nie 1, 10, 11, 2) */
export function sortWykeByNommer<T extends { naam: string }>(wyke: T[]): T[] {
  return [...wyke].sort((a, b) => getWykSortKey(a) - getWykSortKey(b));
}
