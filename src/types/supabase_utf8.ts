export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      artikels_indienings: {
        Row: {
          created_at: string | null
          gebruiker_id: string | null
          id: string
          inhoud: string
          status: string
          tipe_id: string | null
          titel: string
          woord_telling: number
        }
        Insert: {
          created_at?: string | null
          gebruiker_id?: string | null
          id?: string
          inhoud: string
          status?: string
          tipe_id?: string | null
          titel: string
          woord_telling: number
        }
        Update: {
          created_at?: string | null
          gebruiker_id?: string | null
          id?: string
          inhoud?: string
          status?: string
          tipe_id?: string | null
          titel?: string
          woord_telling?: number
        }
        Relationships: [
          {
            foreignKeyName: "artikels_indienings_gebruiker_id_fkey"
            columns: ["gebruiker_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artikels_indienings_tipe_id_fkey"
            columns: ["tipe_id"]
            isOneToOne: false
            referencedRelation: "artikels_tipes"
            referencedColumns: ["id"]
          },
        ]
      }
      artikels_tipes: {
        Row: {
          aktief: boolean | null
          created_at: string | null
          id: string
          maks_woorde: number | null
          naam: string
        }
        Insert: {
          aktief?: boolean | null
          created_at?: string | null
          id?: string
          maks_woorde?: number | null
          naam: string
        }
        Update: {
          aktief?: boolean | null
          created_at?: string | null
          id?: string
          maks_woorde?: number | null
          naam?: string
        }
        Relationships: []
      }
      bedieningsbehoefte_registrasies: {
        Row: {
          created_at: string | null
          gemeente_id: string | null
          gemeente_naam: string | null
          id: string
          ontvang_kennisgewings: boolean | null
          predikant_email: string | null
          predikant_id: string
          predikant_naam: string | null
        }
        Insert: {
          created_at?: string | null
          gemeente_id?: string | null
          gemeente_naam?: string | null
          id?: string
          ontvang_kennisgewings?: boolean | null
          predikant_email?: string | null
          predikant_id: string
          predikant_naam?: string | null
        }
        Update: {
          created_at?: string | null
          gemeente_id?: string | null
          gemeente_naam?: string | null
          id?: string
          ontvang_kennisgewings?: boolean | null
          predikant_email?: string | null
          predikant_id?: string
          predikant_naam?: string | null
        }
        Relationships: []
      }
      bedieningsbehoeftes: {
        Row: {
          aanmelder_id: string | null
          aanmelder_naam: string | null
          ander_beskrywing: string | null
          beskrywing: string | null
          created_at: string | null
          datum: string | null
          gemeente_id: string | null
          gemeente_naam: string | null
          id: string
          kontaknommer: string | null
          plek: string | null
          status: string
          tipe: string
          tyd: string | null
          updated_at: string | null
          vervul_datum: string | null
          vervuller_id: string | null
          vervuller_kontaknommer: string | null
          vervuller_naam: string | null
        }
        Insert: {
          aanmelder_id?: string | null
          aanmelder_naam?: string | null
          ander_beskrywing?: string | null
          beskrywing?: string | null
          created_at?: string | null
          datum?: string | null
          gemeente_id?: string | null
          gemeente_naam?: string | null
          id?: string
          kontaknommer?: string | null
          plek?: string | null
          status?: string
          tipe?: string
          tyd?: string | null
          updated_at?: string | null
          vervul_datum?: string | null
          vervuller_id?: string | null
          vervuller_kontaknommer?: string | null
          vervuller_naam?: string | null
        }
        Update: {
          aanmelder_id?: string | null
          aanmelder_naam?: string | null
          ander_beskrywing?: string | null
          beskrywing?: string | null
          created_at?: string | null
          datum?: string | null
          gemeente_id?: string | null
          gemeente_naam?: string | null
          id?: string
          kontaknommer?: string | null
          plek?: string | null
          status?: string
          tipe?: string
          tyd?: string | null
          updated_at?: string | null
          vervul_datum?: string | null
          vervuller_id?: string | null
          vervuller_kontaknommer?: string | null
          vervuller_naam?: string | null
        }
        Relationships: []
      }
      besoekpunte: {
        Row: {
          adres: string | null
          beskrywing: string | null
          created_at: string | null
          gemeente_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          naam: string
          updated_at: string | null
          wyk_id: string | null
        }
        Insert: {
          adres?: string | null
          beskrywing?: string | null
          created_at?: string | null
          gemeente_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          naam: string
          updated_at?: string | null
          wyk_id?: string | null
        }
        Update: {
          adres?: string | null
          beskrywing?: string | null
          created_at?: string | null
          gemeente_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          naam?: string
          updated_at?: string | null
          wyk_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "besoekpunte_gemeente_id_fkey"
            columns: ["gemeente_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "besoekpunte_wyk_id_fkey"
            columns: ["wyk_id"]
            isOneToOne: false
            referencedRelation: "wyke"
            referencedColumns: ["id"]
          },
        ]
      }
      betalings: {
        Row: {
          bedrag: number
          beskrywing: string | null
          betaal_datum: string | null
          created_at: string | null
          gebruiker_id: string | null
          gemeente_id: string | null
          id: string
          status: string | null
          tipe: string
          updated_at: string | null
          yoco_checkout_id: string | null
        }
        Insert: {
          bedrag: number
          beskrywing?: string | null
          betaal_datum?: string | null
          created_at?: string | null
          gebruiker_id?: string | null
          gemeente_id?: string | null
          id?: string
          status?: string | null
          tipe: string
          updated_at?: string | null
          yoco_checkout_id?: string | null
        }
        Update: {
          bedrag?: number
          beskrywing?: string | null
          betaal_datum?: string | null
          created_at?: string | null
          gebruiker_id?: string | null
          gemeente_id?: string | null
          id?: string
          status?: string | null
          tipe?: string
          updated_at?: string | null
          yoco_checkout_id?: string | null
        }
        Relationships: []
      }
      boodskap_ontvangers: {
        Row: {
          boodskap_id: string | null
          created_at: string | null
          gelees_op: string | null
          id: string
          ontvanger_id: string | null
          ontvanger_naam: string
          verwyder_op: string | null
        }
        Insert: {
          boodskap_id?: string | null
          created_at?: string | null
          gelees_op?: string | null
          id?: string
          ontvanger_id?: string | null
          ontvanger_naam: string
          verwyder_op?: string | null
        }
        Update: {
          boodskap_id?: string | null
          created_at?: string | null
          gelees_op?: string | null
          id?: string
          ontvanger_id?: string | null
          ontvanger_naam?: string
          verwyder_op?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boodskap_ontvangers_boodskap_id_fkey"
            columns: ["boodskap_id"]
            isOneToOne: false
            referencedRelation: "boodskappe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boodskap_ontvangers_ontvanger_id_fkey"
            columns: ["ontvanger_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      boodskappe: {
        Row: {
          created_at: string | null
          gemeente_id: string | null
          groep_id: string | null
          groep_rol: string | null
          groep_tipe: string | null
          id: string
          inhoud: string
          is_groep_boodskap: boolean | null
          onderwerp: string
          sender_id: string | null
          sender_naam: string
        }
        Insert: {
          created_at?: string | null
          gemeente_id?: string | null
          groep_id?: string | null
          groep_rol?: string | null
          groep_tipe?: string | null
          id?: string
          inhoud: string
          is_groep_boodskap?: boolean | null
          onderwerp: string
          sender_id?: string | null
          sender_naam: string
        }
        Update: {
          created_at?: string | null
          gemeente_id?: string | null
          groep_id?: string | null
          groep_rol?: string | null
          groep_tipe?: string | null
          id?: string
          inhoud?: string
          is_groep_boodskap?: boolean | null
          onderwerp?: string
          sender_id?: string | null
          sender_naam?: string
        }
        Relationships: [
          {
            foreignKeyName: "boodskappe_gemeente_id_fkey"
            columns: ["gemeente_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boodskappe_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      congregation_inventory: {
        Row: {
          compliance_notes: string | null
          congregation_id: string
          created_at: string | null
          created_by: string | null
          date_from: string | null
          date_to: string | null
          format: string | null
          id: string
          is_compliant: boolean | null
          item_category: string | null
          item_name: string
          updated_at: string | null
        }
        Insert: {
          compliance_notes?: string | null
          congregation_id: string
          created_at?: string | null
          created_by?: string | null
          date_from?: string | null
          date_to?: string | null
          format?: string | null
          id?: string
          is_compliant?: boolean | null
          item_category?: string | null
          item_name: string
          updated_at?: string | null
        }
        Update: {
          compliance_notes?: string | null
          congregation_id?: string
          created_at?: string | null
          created_by?: string | null
          date_from?: string | null
          date_to?: string | null
          format?: string | null
          id?: string
          is_compliant?: boolean | null
          item_category?: string | null
          item_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "congregation_inventory_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
        ]
      }
      congregation_statistics: {
        Row: {
          baptisms: number | null
          baptized_members: number
          births: number | null
          confessing_members: number
          confirmations: number | null
          congregation_id: string
          created_at: string | null
          created_by: string | null
          deaths: number | null
          id: string
          notes: string | null
          total_souls: number | null
          transfers_in: number | null
          transfers_out: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          baptisms?: number | null
          baptized_members?: number
          births?: number | null
          confessing_members?: number
          confirmations?: number | null
          congregation_id: string
          created_at?: string | null
          created_by?: string | null
          deaths?: number | null
          id?: string
          notes?: string | null
          total_souls?: number | null
          transfers_in?: number | null
          transfers_out?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          baptisms?: number | null
          baptized_members?: number
          births?: number | null
          confessing_members?: number
          confirmations?: number | null
          congregation_id?: string
          created_at?: string | null
          created_by?: string | null
          deaths?: number | null
          id?: string
          notes?: string | null
          total_souls?: number | null
          transfers_in?: number | null
          transfers_out?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "congregation_statistics_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
        ]
      }
      dagstukkies: {
        Row: {
          created_at: string | null
          dag: string
          erediens_id: string | null
          id: string
          inhoud: string
          skrifverwysing: string | null
          titel: string
        }
        Insert: {
          created_at?: string | null
          dag: string
          erediens_id?: string | null
          id?: string
          inhoud: string
          skrifverwysing?: string | null
          titel: string
        }
        Update: {
          created_at?: string | null
          dag?: string
          erediens_id?: string | null
          id?: string
          inhoud?: string
          skrifverwysing?: string | null
          titel?: string
        }
        Relationships: [
          {
            foreignKeyName: "dagstukkies_erediens_id_fkey"
            columns: ["erediens_id"]
            isOneToOne: false
            referencedRelation: "erediens_info"
            referencedColumns: ["id"]
          },
        ]
      }
      dokument_kategoriee: {
        Row: {
          aktief: boolean | null
          beskrywing: string | null
          created_at: string | null
          gemeente_id: string
          id: string
          is_stelsel: boolean | null
          naam: string
          opgelaai_deur: string | null
          updated_at: string | null
        }
        Insert: {
          aktief?: boolean | null
          beskrywing?: string | null
          created_at?: string | null
          gemeente_id: string
          id?: string
          is_stelsel?: boolean | null
          naam: string
          opgelaai_deur?: string | null
          updated_at?: string | null
        }
        Update: {
          aktief?: boolean | null
          beskrywing?: string | null
          created_at?: string | null
          gemeente_id?: string
          id?: string
          is_stelsel?: boolean | null
          naam?: string
          opgelaai_deur?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dokumente: {
        Row: {
          beskrywing: string | null
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          gemeente_id: string
          id: string
          is_publiek: boolean | null
          kategorie: string
          lidmaat_id: string | null
          lidmaat_naam: string | null
          opgelaai_deur: string | null
          titel: string
          updated_at: string | null
        }
        Insert: {
          beskrywing?: string | null
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          gemeente_id: string
          id?: string
          is_publiek?: boolean | null
          kategorie: string
          lidmaat_id?: string | null
          lidmaat_naam?: string | null
          opgelaai_deur?: string | null
          titel: string
          updated_at?: string | null
        }
        Update: {
          beskrywing?: string | null
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          gemeente_id?: string
          id?: string
          is_publiek?: boolean | null
          kategorie?: string
          lidmaat_id?: string | null
          lidmaat_naam?: string | null
          opgelaai_deur?: string | null
          titel?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      erediens_info: {
        Row: {
          created_at: string | null
          created_by: string | null
          gemeente_id: string | null
          id: string
          preek_opsomming: string | null
          skriflesing: string | null
          sondag_datum: string
          tema: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          gemeente_id?: string | null
          id?: string
          preek_opsomming?: string | null
          skriflesing?: string | null
          sondag_datum: string
          tema?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          gemeente_id?: string | null
          id?: string
          preek_opsomming?: string | null
          skriflesing?: string | null
          sondag_datum?: string
          tema?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erediens_info_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erediens_info_gemeente_id_fkey"
            columns: ["gemeente_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
        ]
      }
      eredienste: {
        Row: {
          created_at: string | null
          datum: string
          gemeente_id: string
          id: string
          liturgie_punte: Json | null
          preek_opsomming: string | null
          skriflesing: string | null
          tema: string | null
          tyd: string | null
        }
        Insert: {
          created_at?: string | null
          datum: string
          gemeente_id: string
          id?: string
          liturgie_punte?: Json | null
          preek_opsomming?: string | null
          skriflesing?: string | null
          tema?: string | null
          tyd?: string | null
        }
        Update: {
          created_at?: string | null
          datum?: string
          gemeente_id?: string
          id?: string
          liturgie_punte?: Json | null
          preek_opsomming?: string | null
          skriflesing?: string | null
          tema?: string | null
          tyd?: string | null
        }
        Relationships: []
      }
      gawes_en_talente: {
        Row: {
          aktief: boolean | null
          beskrywing: string | null
          created_at: string | null
          gebruiker_id: string
          gemeente_id: string | null
          id: string
          is_betaald: boolean | null
          is_vrywillig: boolean | null
          kontak_metode: string | null
          titel: string
          updated_at: string | null
        }
        Insert: {
          aktief?: boolean | null
          beskrywing?: string | null
          created_at?: string | null
          gebruiker_id: string
          gemeente_id?: string | null
          id?: string
          is_betaald?: boolean | null
          is_vrywillig?: boolean | null
          kontak_metode?: string | null
          titel: string
          updated_at?: string | null
        }
        Update: {
          aktief?: boolean | null
          beskrywing?: string | null
          created_at?: string | null
          gebruiker_id?: string
          gemeente_id?: string | null
          id?: string
          is_betaald?: boolean | null
          is_vrywillig?: boolean | null
          kontak_metode?: string | null
          titel?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gawes_en_talente_gebruiker_id_fkey"
            columns: ["gebruiker_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gawes_en_talente_gemeente_id_fkey"
            columns: ["gemeente_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
        ]
      }
      gebruikers: {
        Row: {
          adres: string | null
          aktief: boolean | null
          app_roles: string[] | null
          belydenis_van_geloof_datum: string | null
          besoekpunt_id: string | null
          created_at: string | null
          datum_oorlede: string | null
          datum_verhuis: string | null
          doop_datum: string | null
          epos: string | null
          epos_2: string | null
          geboortedatum: string | null
          gemeente_id: string | null
          geslag: string | null
          id: string
          is_oorlede: boolean | null
          laaste_kontak: string | null
          landlyn: string | null
          latitude: number | null
          lidmaat_status: string | null
          longitude: number | null
          naam: string
          noemnaam: string | null
          nooiensvan: string | null
          notas: string | null
          ouderdom: number | null
          popia_toestemming: boolean | null
          popia_toestemming_datum: string | null
          portefeulje_1: string | null
          portefeulje_2: string | null
          portefeulje_3: string | null
          poskode: string | null
          profile_pic_url: string | null
          rol: string | null
          selfoon: string | null
          stad_dorp: string | null
          sterf_datum: string | null
          straat_naam: string | null
          straat_nommer: string | null
          titel: string | null
          updated_at: string | null
          van: string
          voornaam_1: string | null
          voornaam_2: string | null
          voornaam_3: string | null
          voorstad: string | null
          wagwoord_hash: string | null
          woonkompleks_naam: string | null
          woonkompleks_nommer: string | null
          wyk_id: string | null
        }
        Insert: {
          adres?: string | null
          aktief?: boolean | null
          app_roles?: string[] | null
          belydenis_van_geloof_datum?: string | null
          besoekpunt_id?: string | null
          created_at?: string | null
          datum_oorlede?: string | null
          datum_verhuis?: string | null
          doop_datum?: string | null
          epos?: string | null
          epos_2?: string | null
          geboortedatum?: string | null
          gemeente_id?: string | null
          geslag?: string | null
          id?: string
          is_oorlede?: boolean | null
          laaste_kontak?: string | null
          landlyn?: string | null
          latitude?: number | null
          lidmaat_status?: string | null
          longitude?: number | null
          naam: string
          noemnaam?: string | null
          nooiensvan?: string | null
          notas?: string | null
          ouderdom?: number | null
          popia_toestemming?: boolean | null
          popia_toestemming_datum?: string | null
          portefeulje_1?: string | null
          portefeulje_2?: string | null
          portefeulje_3?: string | null
          poskode?: string | null
          profile_pic_url?: string | null
          rol?: string | null
          selfoon?: string | null
          stad_dorp?: string | null
          sterf_datum?: string | null
          straat_naam?: string | null
          straat_nommer?: string | null
          titel?: string | null
          updated_at?: string | null
          van: string
          voornaam_1?: string | null
          voornaam_2?: string | null
          voornaam_3?: string | null
          voorstad?: string | null
          wagwoord_hash?: string | null
          woonkompleks_naam?: string | null
          woonkompleks_nommer?: string | null
          wyk_id?: string | null
        }
        Update: {
          adres?: string | null
          aktief?: boolean | null
          app_roles?: string[] | null
          belydenis_van_geloof_datum?: string | null
          besoekpunt_id?: string | null
          created_at?: string | null
          datum_oorlede?: string | null
          datum_verhuis?: string | null
          doop_datum?: string | null
          epos?: string | null
          epos_2?: string | null
          geboortedatum?: string | null
          gemeente_id?: string | null
          geslag?: string | null
          id?: string
          is_oorlede?: boolean | null
          laaste_kontak?: string | null
          landlyn?: string | null
          latitude?: number | null
          lidmaat_status?: string | null
          longitude?: number | null
          naam?: string
          noemnaam?: string | null
          nooiensvan?: string | null
          notas?: string | null
          ouderdom?: number | null
          popia_toestemming?: boolean | null
          popia_toestemming_datum?: string | null
          portefeulje_1?: string | null
          portefeulje_2?: string | null
          portefeulje_3?: string | null
          poskode?: string | null
          profile_pic_url?: string | null
          rol?: string | null
          selfoon?: string | null
          stad_dorp?: string | null
          sterf_datum?: string | null
          straat_naam?: string | null
          straat_nommer?: string | null
          titel?: string | null
          updated_at?: string | null
          van?: string
          voornaam_1?: string | null
          voornaam_2?: string | null
          voornaam_3?: string | null
          voorstad?: string | null
          wagwoord_hash?: string | null
          woonkompleks_naam?: string | null
          woonkompleks_nommer?: string | null
          wyk_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gebruikers_gemeente_id_fkey"
            columns: ["gemeente_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
        ]
      }
      geloofsonderrig_ai_logs: {
        Row: {
          ai_response: string
          analise_opsomming: string | null
          created_at: string | null
          id: string
          kgvw_scores: Json | null
          leerder_id: string | null
          les_id: string | null
          user_message: string
        }
        Insert: {
          ai_response: string
          analise_opsomming?: string | null
          created_at?: string | null
          id?: string
          kgvw_scores?: Json | null
          leerder_id?: string | null
          les_id?: string | null
          user_message: string
        }
        Update: {
          ai_response?: string
          analise_opsomming?: string | null
          created_at?: string | null
          id?: string
          kgvw_scores?: Json | null
          leerder_id?: string | null
          les_id?: string | null
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "geloofsonderrig_ai_logs_leerder_id_fkey"
            columns: ["leerder_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geloofsonderrig_ai_logs_les_id_fkey"
            columns: ["les_id"]
            isOneToOne: false
            referencedRelation: "geloofsonderrig_lesse"
            referencedColumns: ["id"]
          },
        ]
      }
      geloofsonderrig_betalings: {
        Row: {
          bedrag: number
          betaal_deur: string | null
          betaal_tipe: string | null
          created_at: string | null
          gemeente_id: string
          id: string
          leerder_id: string
          status: string
          updated_at: string | null
          yoco_checkout_id: string | null
        }
        Insert: {
          bedrag?: number
          betaal_deur?: string | null
          betaal_tipe?: string | null
          created_at?: string | null
          gemeente_id: string
          id?: string
          leerder_id: string
          status?: string
          updated_at?: string | null
          yoco_checkout_id?: string | null
        }
        Update: {
          bedrag?: number
          betaal_deur?: string | null
          betaal_tipe?: string | null
          created_at?: string | null
          gemeente_id?: string
          id?: string
          leerder_id?: string
          status?: string
          updated_at?: string | null
          yoco_checkout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geloofsonderrig_betalings_betaal_deur_fkey"
            columns: ["betaal_deur"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geloofsonderrig_betalings_gemeente_id_fkey"
            columns: ["gemeente_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geloofsonderrig_betalings_leerder_id_fkey"
            columns: ["leerder_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      geloofsonderrig_files: {
        Row: {
          created_at: string | null
          file_data: string
          file_name: string
          id: string
          mime_type: string
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_data: string
          file_name: string
          id?: string
          mime_type: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_data?: string
          file_name?: string
          id?: string
          mime_type?: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geloofsonderrig_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      geloofsonderrig_grade: {
        Row: {
          aktief: boolean | null
          created_at: string | null
          id: string
          naam: string
          updated_at: string | null
          volgorde: number
        }
        Insert: {
          aktief?: boolean | null
          created_at?: string | null
          id?: string
          naam: string
          updated_at?: string | null
          volgorde?: number
        }
        Update: {
          aktief?: boolean | null
          created_at?: string | null
          id?: string
          naam?: string
          updated_at?: string | null
          volgorde?: number
        }
        Relationships: []
      }
      geloofsonderrig_klas_leerders: {
        Row: {
          created_at: string | null
          id: string
          klas_id: string | null
          leerder_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          klas_id?: string | null
          leerder_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          klas_id?: string | null
          leerder_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geloofsonderrig_klas_leerders_klas_id_fkey"
            columns: ["klas_id"]
            isOneToOne: false
            referencedRelation: "geloofsonderrig_klasse"
            referencedColumns: ["id"]
          },
        ]
      }
      geloofsonderrig_klasse: {
        Row: {
          aktief: boolean | null
          beskrywing: string | null
          created_at: string | null
          gemeente_id: string | null
          graad_id: string | null
          id: string
          kode: string | null
          mentor_id: string | null
          naam: string
        }
        Insert: {
          aktief?: boolean | null
          beskrywing?: string | null
          created_at?: string | null
          gemeente_id?: string | null
          graad_id?: string | null
          id?: string
          kode?: string | null
          mentor_id?: string | null
          naam: string
        }
        Update: {
          aktief?: boolean | null
          beskrywing?: string | null
          created_at?: string | null
          gemeente_id?: string | null
          graad_id?: string | null
          id?: string
          kode?: string | null
          mentor_id?: string | null
          naam?: string
        }
        Relationships: [
          {
            foreignKeyName: "geloofsonderrig_klasse_graad_id_fkey"
            columns: ["graad_id"]
            isOneToOne: false
            referencedRelation: "geloofsonderrig_grade"
            referencedColumns: ["id"]
          },
        ]
      }
      geloofsonderrig_lesse: {
        Row: {
          aktief: boolean | null
          created_at: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          inhoud: string | null
          onderwerp_id: string | null
          skrifverwysing: string | null
          titel: string
          video_url: string | null
          volgorde: number | null
        }
        Insert: {
          aktief?: boolean | null
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          inhoud?: string | null
          onderwerp_id?: string | null
          skrifverwysing?: string | null
          titel: string
          video_url?: string | null
          volgorde?: number | null
        }
        Update: {
          aktief?: boolean | null
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          inhoud?: string | null
          onderwerp_id?: string | null
          skrifverwysing?: string | null
          titel?: string
          video_url?: string | null
          volgorde?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "geloofsonderrig_lesse_onderwerp_id_fkey"
            columns: ["onderwerp_id"]
            isOneToOne: false
            referencedRelation: "geloofsonderrig_onderwerpe"
            referencedColumns: ["id"]
          },
        ]
      }
      geloofsonderrig_onderwerpe: {
        Row: {
          aktief: boolean | null
          beskrywing: string | null
          created_at: string | null
          graad_id: string | null
          id: string
          ikoon: string | null
          kleur: string | null
          titel: string
          volgorde: number | null
        }
        Insert: {
          aktief?: boolean | null
          beskrywing?: string | null
          created_at?: string | null
          graad_id?: string | null
          id?: string
          ikoon?: string | null
          kleur?: string | null
          titel: string
          volgorde?: number | null
        }
        Update: {
          aktief?: boolean | null
          beskrywing?: string | null
          created_at?: string | null
          graad_id?: string | null
          id?: string
          ikoon?: string | null
          kleur?: string | null
          titel?: string
          volgorde?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "geloofsonderrig_onderwerpe_graad_id_fkey"
            columns: ["graad_id"]
            isOneToOne: false
            referencedRelation: "geloofsonderrig_grade"
            referencedColumns: ["id"]
          },
        ]
      }
      geloofsonderrig_prente: {
        Row: {
          betekenis: string | null
          created_at: string | null
          id: string
          image_url: string | null
          leerder_id: string | null
          les_id: string | null
          prompt: string | null
        }
        Insert: {
          betekenis?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          leerder_id?: string | null
          les_id?: string | null
          prompt?: string | null
        }
        Update: {
          betekenis?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          leerder_id?: string | null
          les_id?: string | null
          prompt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geloofsonderrig_prente_les_id_fkey"
            columns: ["les_id"]
            isOneToOne: false
            referencedRelation: "geloofsonderrig_lesse"
            referencedColumns: ["id"]
          },
        ]
      }
      geloofsonderrig_punte: {
        Row: {
          aksie_tipe: string
          created_at: string | null
          id: string
          leerder_id: string
          les_id: string | null
          punte: number
        }
        Insert: {
          aksie_tipe: string
          created_at?: string | null
          id?: string
          leerder_id: string
          les_id?: string | null
          punte?: number
        }
        Update: {
          aksie_tipe?: string
          created_at?: string | null
          id?: string
          leerder_id?: string
          les_id?: string | null
          punte?: number
        }
        Relationships: [
          {
            foreignKeyName: "geloofsonderrig_punte_leerder_id_fkey"
            columns: ["leerder_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geloofsonderrig_punte_les_id_fkey"
            columns: ["les_id"]
            isOneToOne: false
            referencedRelation: "geloofsonderrig_lesse"
            referencedColumns: ["id"]
          },
        ]
      }
      geloofsonderrig_vordering: {
        Row: {
          created_at: string | null
          id: string
          leerder_id: string | null
          les_id: string | null
          onderwerp_id: string | null
          persentasie: number | null
          quiz_score: number | null
          quiz_total: number | null
          updated_at: string | null
          verse_completed: number | null
          verse_total: number | null
          visualiserings_count: number | null
          voltooi: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          leerder_id?: string | null
          les_id?: string | null
          onderwerp_id?: string | null
          persentasie?: number | null
          quiz_score?: number | null
          quiz_total?: number | null
          updated_at?: string | null
          verse_completed?: number | null
          verse_total?: number | null
          visualiserings_count?: number | null
          voltooi?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          leerder_id?: string | null
          les_id?: string | null
          onderwerp_id?: string | null
          persentasie?: number | null
          quiz_score?: number | null
          quiz_total?: number | null
          updated_at?: string | null
          verse_completed?: number | null
          verse_total?: number | null
          visualiserings_count?: number | null
          voltooi?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "geloofsonderrig_vordering_les_id_fkey"
            columns: ["les_id"]
            isOneToOne: false
            referencedRelation: "geloofsonderrig_lesse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geloofsonderrig_vordering_onderwerp_id_fkey"
            columns: ["onderwerp_id"]
            isOneToOne: false
            referencedRelation: "geloofsonderrig_onderwerpe"
            referencedColumns: ["id"]
          },
        ]
      }
      geloofsonderrig_vrae: {
        Row: {
          created_at: string | null
          id: string
          les_id: string | null
          volgorde: number | null
          vraag: string
          wenk: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          les_id?: string | null
          volgorde?: number | null
          vraag: string
          wenk?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          les_id?: string | null
          volgorde?: number | null
          vraag?: string
          wenk?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geloofsonderrig_vrae_les_id_fkey"
            columns: ["les_id"]
            isOneToOne: false
            referencedRelation: "geloofsonderrig_lesse"
            referencedColumns: ["id"]
          },
        ]
      }
      gemeente_program: {
        Row: {
          beskrywing: string | null
          created_at: string | null
          created_by: string | null
          datum: string
          gemeente_id: string | null
          id: string
          plek: string | null
          tipe: string
          titel: string
          tyd: string | null
          updated_at: string | null
        }
        Insert: {
          beskrywing?: string | null
          created_at?: string | null
          created_by?: string | null
          datum: string
          gemeente_id?: string | null
          id?: string
          plek?: string | null
          tipe: string
          titel: string
          tyd?: string | null
          updated_at?: string | null
        }
        Update: {
          beskrywing?: string | null
          created_at?: string | null
          created_by?: string | null
          datum?: string
          gemeente_id?: string | null
          id?: string
          plek?: string | null
          tipe?: string
          titel?: string
          tyd?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gemeente_statistiek_logs: {
        Row: {
          beskrywing: string | null
          datum: string | null
          gebruiker_id: string | null
          gemeente_id: string | null
          id: string
          rede: string | null
          tipe: string
        }
        Insert: {
          beskrywing?: string | null
          datum?: string | null
          gebruiker_id?: string | null
          gemeente_id?: string | null
          id?: string
          rede?: string | null
          tipe: string
        }
        Update: {
          beskrywing?: string | null
          datum?: string | null
          gebruiker_id?: string | null
          gemeente_id?: string | null
          id?: string
          rede?: string | null
          tipe?: string
        }
        Relationships: [
          {
            foreignKeyName: "gemeente_statistiek_logs_gebruiker_id_fkey"
            columns: ["gebruiker_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemeente_statistiek_logs_gemeente_id_fkey"
            columns: ["gemeente_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
        ]
      }
      gemeentes: {
        Row: {
          adres: string | null
          aktief: boolean | null
          beskrywing: string | null
          created_at: string | null
          epos: string | null
          erediens_tye: string | null
          id: string
          is_demo: boolean | null
          last_data_update: string | null
          logo_url: string | null
          naam: string
          ring: string | null
          sluit_uit_van_statistiek: boolean | null
          stigtingsdatum: string | null
          telefoon: string | null
          updated_at: string | null
          webwerf: string | null
        }
        Insert: {
          adres?: string | null
          aktief?: boolean | null
          beskrywing?: string | null
          created_at?: string | null
          epos?: string | null
          erediens_tye?: string | null
          id?: string
          is_demo?: boolean | null
          last_data_update?: string | null
          logo_url?: string | null
          naam: string
          ring?: string | null
          sluit_uit_van_statistiek?: boolean | null
          stigtingsdatum?: string | null
          telefoon?: string | null
          updated_at?: string | null
          webwerf?: string | null
        }
        Update: {
          adres?: string | null
          aktief?: boolean | null
          beskrywing?: string | null
          created_at?: string | null
          epos?: string | null
          erediens_tye?: string | null
          id?: string
          is_demo?: boolean | null
          last_data_update?: string | null
          logo_url?: string | null
          naam?: string
          ring?: string | null
          sluit_uit_van_statistiek?: boolean | null
          stigtingsdatum?: string | null
          telefoon?: string | null
          updated_at?: string | null
          webwerf?: string | null
        }
        Relationships: []
      }
      jy_is_myne_children: {
        Row: {
          baptism_date: string | null
          birth_date: string | null
          created_at: string | null
          expected_date: string | null
          gemeente_id: string | null
          id: string
          name: string
          phase: number
          profile_image_url: string | null
          user_id: string | null
        }
        Insert: {
          baptism_date?: string | null
          birth_date?: string | null
          created_at?: string | null
          expected_date?: string | null
          gemeente_id?: string | null
          id?: string
          name: string
          phase: number
          profile_image_url?: string | null
          user_id?: string | null
        }
        Update: {
          baptism_date?: string | null
          birth_date?: string | null
          created_at?: string | null
          expected_date?: string | null
          gemeente_id?: string | null
          id?: string
          name?: string
          phase?: number
          profile_image_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      jy_is_myne_journal: {
        Row: {
          child_id: string | null
          content: string | null
          created_at: string | null
          date: string | null
          entry_type: string | null
          id: string
          image_url: string | null
          phase: number | null
          tags: string[] | null
          title: string
          user_id: string | null
        }
        Insert: {
          child_id?: string | null
          content?: string | null
          created_at?: string | null
          date?: string | null
          entry_type?: string | null
          id?: string
          image_url?: string | null
          phase?: number | null
          tags?: string[] | null
          title: string
          user_id?: string | null
        }
        Update: {
          child_id?: string | null
          content?: string | null
          created_at?: string | null
          date?: string | null
          entry_type?: string | null
          id?: string
          image_url?: string | null
          phase?: number | null
          tags?: string[] | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jy_is_myne_journal_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "jy_is_myne_children"
            referencedColumns: ["id"]
          },
        ]
      }
      jy_is_myne_phase_content: {
        Row: {
          age_range: string
          baptism_focus: string | null
          communion_focus: string | null
          conversation_themes: string[] | null
          created_at: string | null
          development_goals: string[] | null
          family_projects: string[] | null
          id: string
          monthly_activities: Json | null
          parent_reflections: string[] | null
          phase: number
          phase_name: string
          symbolism: string | null
          weekly_activities: Json | null
          worship_integration: string | null
        }
        Insert: {
          age_range: string
          baptism_focus?: string | null
          communion_focus?: string | null
          conversation_themes?: string[] | null
          created_at?: string | null
          development_goals?: string[] | null
          family_projects?: string[] | null
          id?: string
          monthly_activities?: Json | null
          parent_reflections?: string[] | null
          phase: number
          phase_name: string
          symbolism?: string | null
          weekly_activities?: Json | null
          worship_integration?: string | null
        }
        Update: {
          age_range?: string
          baptism_focus?: string | null
          communion_focus?: string | null
          conversation_themes?: string[] | null
          created_at?: string | null
          development_goals?: string[] | null
          family_projects?: string[] | null
          id?: string
          monthly_activities?: Json | null
          parent_reflections?: string[] | null
          phase?: number
          phase_name?: string
          symbolism?: string | null
          weekly_activities?: Json | null
          worship_integration?: string | null
        }
        Relationships: []
      }
      jy_is_myne_toolkit: {
        Row: {
          age_groups: string[] | null
          category: string
          content: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          liturgical_season: string | null
          sort_order: number | null
          title: string
        }
        Insert: {
          age_groups?: string[] | null
          category: string
          content: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          liturgical_season?: string | null
          sort_order?: number | null
          title: string
        }
        Update: {
          age_groups?: string[] | null
          category?: string
          content?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          liturgical_season?: string | null
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      kk_lesson_attempts: {
        Row: {
          challenge_mode: boolean | null
          completed_at: string | null
          hints_used: number | null
          id: string
          lesson_id: string | null
          questions_answered: number | null
          questions_correct: number | null
          score_percent: number | null
          time_selected: number | null
          time_spent_seconds: number | null
          user_id: string | null
          variant_type: string | null
        }
        Insert: {
          challenge_mode?: boolean | null
          completed_at?: string | null
          hints_used?: number | null
          id?: string
          lesson_id?: string | null
          questions_answered?: number | null
          questions_correct?: number | null
          score_percent?: number | null
          time_selected?: number | null
          time_spent_seconds?: number | null
          user_id?: string | null
          variant_type?: string | null
        }
        Update: {
          challenge_mode?: boolean | null
          completed_at?: string | null
          hints_used?: number | null
          id?: string
          lesson_id?: string | null
          questions_answered?: number | null
          questions_correct?: number | null
          score_percent?: number | null
          time_selected?: number | null
          time_spent_seconds?: number | null
          user_id?: string | null
          variant_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kk_lesson_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "kk_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      kk_lesson_variants: {
        Row: {
          created_at: string | null
          explanation_points: string[] | null
          hook_text: string | null
          id: string
          lesson_id: string | null
          parent_prompt: string | null
          story_text: string | null
          updated_at: string | null
          variant_type: string
        }
        Insert: {
          created_at?: string | null
          explanation_points?: string[] | null
          hook_text?: string | null
          id?: string
          lesson_id?: string | null
          parent_prompt?: string | null
          story_text?: string | null
          updated_at?: string | null
          variant_type: string
        }
        Update: {
          created_at?: string | null
          explanation_points?: string[] | null
          hook_text?: string | null
          id?: string
          lesson_id?: string | null
          parent_prompt?: string | null
          story_text?: string | null
          updated_at?: string | null
          variant_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "kk_lesson_variants_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "kk_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      kk_lessons: {
        Row: {
          age_band: string | null
          core_truths: string[] | null
          created_at: string | null
          created_by: string | null
          difficulty: number | null
          id: string
          passage_reference: string | null
          status: string | null
          summary: string | null
          theme_tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          age_band?: string | null
          core_truths?: string[] | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: number | null
          id?: string
          passage_reference?: string | null
          status?: string | null
          summary?: string | null
          theme_tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          age_band?: string | null
          core_truths?: string[] | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: number | null
          id?: string
          passage_reference?: string | null
          status?: string | null
          summary?: string | null
          theme_tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      kk_questions: {
        Row: {
          correct_answer: string | null
          correct_answers: string[] | null
          created_at: string | null
          difficulty: number | null
          explanation: string | null
          hint_text: string | null
          id: string
          lesson_id: string | null
          options: string[] | null
          question_text: string
          question_type: string | null
          skill_tag: string | null
          variant_type: string | null
        }
        Insert: {
          correct_answer?: string | null
          correct_answers?: string[] | null
          created_at?: string | null
          difficulty?: number | null
          explanation?: string | null
          hint_text?: string | null
          id?: string
          lesson_id?: string | null
          options?: string[] | null
          question_text: string
          question_type?: string | null
          skill_tag?: string | null
          variant_type?: string | null
        }
        Update: {
          correct_answer?: string | null
          correct_answers?: string[] | null
          created_at?: string | null
          difficulty?: number | null
          explanation?: string | null
          hint_text?: string | null
          id?: string
          lesson_id?: string | null
          options?: string[] | null
          question_text?: string
          question_type?: string | null
          skill_tag?: string | null
          variant_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kk_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "kk_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      kk_user_progress: {
        Row: {
          average_score: number | null
          created_at: string | null
          current_streak: number | null
          id: string
          last_lesson_date: string | null
          longest_streak: number | null
          total_lessons_completed: number | null
          total_time_spent_seconds: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          average_score?: number | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_lesson_date?: string | null
          longest_streak?: number | null
          total_lessons_completed?: number | null
          total_time_spent_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          average_score?: number | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_lesson_date?: string | null
          longest_streak?: number | null
          total_lessons_completed?: number | null
          total_time_spent_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      krisis_verslae: {
        Row: {
          beskrywing: string
          created_at: string | null
          gebruiker_id: string | null
          gemeente_id: string | null
          id: string
          ingedien_deur: string | null
          notas: string | null
          prioriteit: string | null
          status: string | null
          tipe: string
          updated_at: string | null
        }
        Insert: {
          beskrywing: string
          created_at?: string | null
          gebruiker_id?: string | null
          gemeente_id?: string | null
          id?: string
          ingedien_deur?: string | null
          notas?: string | null
          prioriteit?: string | null
          status?: string | null
          tipe: string
          updated_at?: string | null
        }
        Update: {
          beskrywing?: string
          created_at?: string | null
          gebruiker_id?: string | null
          gemeente_id?: string | null
          id?: string
          ingedien_deur?: string | null
          notas?: string | null
          prioriteit?: string | null
          status?: string | null
          tipe?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      kuberkermis_bestellings: {
        Row: {
          betaal_status: string | null
          created_at: string | null
          gemeente_id: string
          hoeveelheid: number | null
          id: string
          koper_epos: string | null
          koper_naam: string | null
          koper_selfoon: string | null
          produk_id: string | null
          totaal_bedrag: number | null
          updated_at: string | null
        }
        Insert: {
          betaal_status?: string | null
          created_at?: string | null
          gemeente_id: string
          hoeveelheid?: number | null
          id?: string
          koper_epos?: string | null
          koper_naam?: string | null
          koper_selfoon?: string | null
          produk_id?: string | null
          totaal_bedrag?: number | null
          updated_at?: string | null
        }
        Update: {
          betaal_status?: string | null
          created_at?: string | null
          gemeente_id?: string
          hoeveelheid?: number | null
          id?: string
          koper_epos?: string | null
          koper_naam?: string | null
          koper_selfoon?: string | null
          produk_id?: string | null
          totaal_bedrag?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kuberkermis_bestellings_produk_id_fkey"
            columns: ["produk_id"]
            isOneToOne: false
            referencedRelation: "kuberkermis_produkte"
            referencedColumns: ["id"]
          },
        ]
      }
      kuberkermis_kaartjie_nommers: {
        Row: {
          bestelling_id: string | null
          created_at: string | null
          id: string
          is_verkoop: boolean | null
          nommer: string
          produk_id: string | null
          updated_at: string | null
        }
        Insert: {
          bestelling_id?: string | null
          created_at?: string | null
          id?: string
          is_verkoop?: boolean | null
          nommer: string
          produk_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bestelling_id?: string | null
          created_at?: string | null
          id?: string
          is_verkoop?: boolean | null
          nommer?: string
          produk_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kuberkermis_kaartjie_nommers_bestelling_id_fkey"
            columns: ["bestelling_id"]
            isOneToOne: false
            referencedRelation: "kuberkermis_bestellings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kuberkermis_kaartjie_nommers_produk_id_fkey"
            columns: ["produk_id"]
            isOneToOne: false
            referencedRelation: "kuberkermis_produkte"
            referencedColumns: ["id"]
          },
        ]
      }
      kuberkermis_produkte: {
        Row: {
          aktief: boolean | null
          beskrywing: string | null
          created_at: string | null
          foto_url: string | null
          gemeente_id: string
          geskep_deur: string | null
          id: string
          is_kaartjie: boolean | null
          kategorie: string | null
          lms_kursus_id: string | null
          prys: number | null
          titel: string
          updated_at: string | null
          voorraad: number | null
        }
        Insert: {
          aktief?: boolean | null
          beskrywing?: string | null
          created_at?: string | null
          foto_url?: string | null
          gemeente_id: string
          geskep_deur?: string | null
          id?: string
          is_kaartjie?: boolean | null
          kategorie?: string | null
          lms_kursus_id?: string | null
          prys?: number | null
          titel: string
          updated_at?: string | null
          voorraad?: number | null
        }
        Update: {
          aktief?: boolean | null
          beskrywing?: string | null
          created_at?: string | null
          foto_url?: string | null
          gemeente_id?: string
          geskep_deur?: string | null
          id?: string
          is_kaartjie?: boolean | null
          kategorie?: string | null
          lms_kursus_id?: string | null
          prys?: number | null
          titel?: string
          updated_at?: string | null
          voorraad?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kuberkermis_produkte_lms_kursus_id_fkey"
            columns: ["lms_kursus_id"]
            isOneToOne: false
            referencedRelation: "lms_kursusse"
            referencedColumns: ["id"]
          },
        ]
      }
      lidmaat_verhoudings: {
        Row: {
          created_at: string | null
          gemeente_id: string | null
          id: string
          lidmaat_id: string | null
          updated_at: string | null
          verhouding_beskrywing: string | null
          verhouding_tipe: string
          verwante_id: string | null
        }
        Insert: {
          created_at?: string | null
          gemeente_id?: string | null
          id?: string
          lidmaat_id?: string | null
          updated_at?: string | null
          verhouding_beskrywing?: string | null
          verhouding_tipe: string
          verwante_id?: string | null
        }
        Update: {
          created_at?: string | null
          gemeente_id?: string | null
          id?: string
          lidmaat_id?: string | null
          updated_at?: string | null
          verhouding_beskrywing?: string | null
          verhouding_tipe?: string
          verwante_id?: string | null
        }
        Relationships: []
      }
      lms_kursus_vouchers: {
        Row: {
          bestelling_id: string | null
          created_at: string | null
          id: string
          kursus_id: string
          used_at: string | null
          used_by: string | null
          voucher_kode: string
        }
        Insert: {
          bestelling_id?: string | null
          created_at?: string | null
          id?: string
          kursus_id: string
          used_at?: string | null
          used_by?: string | null
          voucher_kode: string
        }
        Update: {
          bestelling_id?: string | null
          created_at?: string | null
          id?: string
          kursus_id?: string
          used_at?: string | null
          used_by?: string | null
          voucher_kode?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_kursus_vouchers_bestelling_id_fkey"
            columns: ["bestelling_id"]
            isOneToOne: false
            referencedRelation: "kuberkermis_bestellings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_kursus_vouchers_kursus_id_fkey"
            columns: ["kursus_id"]
            isOneToOne: false
            referencedRelation: "lms_kursusse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_kursus_vouchers_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_kursusse: {
        Row: {
          beskrywing: string | null
          created_at: string | null
          duur_minute: number | null
          foto_url: string | null
          geskep_deur: string | null
          id: string
          is_aktief: boolean | null
          is_gepubliseer: boolean | null
          is_gratis: boolean | null
          is_missionaal: boolean | null
          is_vbo_geskik: boolean | null
          kategorie: string | null
          kort_beskrywing: string | null
          prys: number | null
          titel: string
          updated_at: string | null
          vbo_krediete: number | null
          vereistes: string | null
          video_voorskou_url: string | null
          vlak: string | null
          wat_jy_sal_leer: string[] | null
        }
        Insert: {
          beskrywing?: string | null
          created_at?: string | null
          duur_minute?: number | null
          foto_url?: string | null
          geskep_deur?: string | null
          id?: string
          is_aktief?: boolean | null
          is_gepubliseer?: boolean | null
          is_gratis?: boolean | null
          is_missionaal?: boolean | null
          is_vbo_geskik?: boolean | null
          kategorie?: string | null
          kort_beskrywing?: string | null
          prys?: number | null
          titel: string
          updated_at?: string | null
          vbo_krediete?: number | null
          vereistes?: string | null
          video_voorskou_url?: string | null
          vlak?: string | null
          wat_jy_sal_leer?: string[] | null
        }
        Update: {
          beskrywing?: string | null
          created_at?: string | null
          duur_minute?: number | null
          foto_url?: string | null
          geskep_deur?: string | null
          id?: string
          is_aktief?: boolean | null
          is_gepubliseer?: boolean | null
          is_gratis?: boolean | null
          is_missionaal?: boolean | null
          is_vbo_geskik?: boolean | null
          kategorie?: string | null
          kort_beskrywing?: string | null
          prys?: number | null
          titel?: string
          updated_at?: string | null
          vbo_krediete?: number | null
          vereistes?: string | null
          video_voorskou_url?: string | null
          vlak?: string | null
          wat_jy_sal_leer?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_kursusse_geskep_deur_fkey"
            columns: ["geskep_deur"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_lesse: {
        Row: {
          bylaes: Json | null
          created_at: string | null
          duur_minute: number | null
          id: string
          inhoud: string | null
          is_aktief: boolean | null
          kursus_id: string | null
          module_id: string | null
          slaag_persentasie: number | null
          tipe: string | null
          titel: string
          updated_at: string | null
          video_url: string | null
          volgorde: number | null
        }
        Insert: {
          bylaes?: Json | null
          created_at?: string | null
          duur_minute?: number | null
          id?: string
          inhoud?: string | null
          is_aktief?: boolean | null
          kursus_id?: string | null
          module_id?: string | null
          slaag_persentasie?: number | null
          tipe?: string | null
          titel: string
          updated_at?: string | null
          video_url?: string | null
          volgorde?: number | null
        }
        Update: {
          bylaes?: Json | null
          created_at?: string | null
          duur_minute?: number | null
          id?: string
          inhoud?: string | null
          is_aktief?: boolean | null
          kursus_id?: string | null
          module_id?: string | null
          slaag_persentasie?: number | null
          tipe?: string | null
          titel?: string
          updated_at?: string | null
          video_url?: string | null
          volgorde?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_lesse_kursus_id_fkey"
            columns: ["kursus_id"]
            isOneToOne: false
            referencedRelation: "lms_kursusse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_lesse_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "lms_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_modules: {
        Row: {
          beskrywing: string | null
          created_at: string | null
          id: string
          is_aktief: boolean | null
          kursus_id: string | null
          titel: string
          updated_at: string | null
          volgorde: number | null
        }
        Insert: {
          beskrywing?: string | null
          created_at?: string | null
          id?: string
          is_aktief?: boolean | null
          kursus_id?: string | null
          titel: string
          updated_at?: string | null
          volgorde?: number | null
        }
        Update: {
          beskrywing?: string | null
          created_at?: string | null
          id?: string
          is_aktief?: boolean | null
          kursus_id?: string | null
          titel?: string
          updated_at?: string | null
          volgorde?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_modules_kursus_id_fkey"
            columns: ["kursus_id"]
            isOneToOne: false
            referencedRelation: "lms_kursusse"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_questions: {
        Row: {
          created_at: string | null
          id: string
          korrekte_antwoord: string | null
          les_id: string
          opsies: Json | null
          punte: number | null
          updated_at: string | null
          volgorde: number | null
          vraag_teks: string
          vraag_tipe: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          korrekte_antwoord?: string | null
          les_id: string
          opsies?: Json | null
          punte?: number | null
          updated_at?: string | null
          volgorde?: number | null
          vraag_teks: string
          vraag_tipe?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          korrekte_antwoord?: string | null
          les_id?: string
          opsies?: Json | null
          punte?: number | null
          updated_at?: string | null
          volgorde?: number | null
          vraag_teks?: string
          vraag_tipe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_questions_les_id_fkey"
            columns: ["les_id"]
            isOneToOne: false
            referencedRelation: "lms_lesse"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_quiz_attempts: {
        Row: {
          antwoorde: Json | null
          created_at: string | null
          gebruiker_id: string
          geslaag: boolean | null
          id: string
          les_id: string
          maksimum_punte: number | null
          persentasie: number | null
          telling: number | null
          voltooi_op: string | null
        }
        Insert: {
          antwoorde?: Json | null
          created_at?: string | null
          gebruiker_id: string
          geslaag?: boolean | null
          id?: string
          les_id: string
          maksimum_punte?: number | null
          persentasie?: number | null
          telling?: number | null
          voltooi_op?: string | null
        }
        Update: {
          antwoorde?: Json | null
          created_at?: string | null
          gebruiker_id?: string
          geslaag?: boolean | null
          id?: string
          les_id?: string
          maksimum_punte?: number | null
          persentasie?: number | null
          telling?: number | null
          voltooi_op?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_quiz_attempts_gebruiker_id_fkey"
            columns: ["gebruiker_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_quiz_attempts_les_id_fkey"
            columns: ["les_id"]
            isOneToOne: false
            referencedRelation: "lms_lesse"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_registrasies: {
        Row: {
          begin_datum: string | null
          betaling_bedrag: number | null
          betaling_status: string | null
          completed_at: string | null
          created_at: string | null
          gebruiker_id: string | null
          id: string
          kursus_id: string | null
          progress: number | null
          status: string | null
        }
        Insert: {
          begin_datum?: string | null
          betaling_bedrag?: number | null
          betaling_status?: string | null
          completed_at?: string | null
          created_at?: string | null
          gebruiker_id?: string | null
          id?: string
          kursus_id?: string | null
          progress?: number | null
          status?: string | null
        }
        Update: {
          begin_datum?: string | null
          betaling_bedrag?: number | null
          betaling_status?: string | null
          completed_at?: string | null
          created_at?: string | null
          gebruiker_id?: string | null
          id?: string
          kursus_id?: string | null
          progress?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_registrasies_gebruiker_id_fkey"
            columns: ["gebruiker_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_registrasies_kursus_id_fkey"
            columns: ["kursus_id"]
            isOneToOne: false
            referencedRelation: "lms_kursusse"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_sertifikate: {
        Row: {
          created_at: string | null
          gebruiker_id: string
          gebruiker_naam: string | null
          id: string
          is_geldig: boolean | null
          kursus_id: string | null
          kursus_titel: string | null
          pdf_url: string | null
          sertifikaat_nommer: string | null
          voltooiing_datum: string | null
        }
        Insert: {
          created_at?: string | null
          gebruiker_id: string
          gebruiker_naam?: string | null
          id?: string
          is_geldig?: boolean | null
          kursus_id?: string | null
          kursus_titel?: string | null
          pdf_url?: string | null
          sertifikaat_nommer?: string | null
          voltooiing_datum?: string | null
        }
        Update: {
          created_at?: string | null
          gebruiker_id?: string
          gebruiker_naam?: string | null
          id?: string
          is_geldig?: boolean | null
          kursus_id?: string | null
          kursus_titel?: string | null
          pdf_url?: string | null
          sertifikaat_nommer?: string | null
          voltooiing_datum?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_sertifikate_gebruiker_id_fkey"
            columns: ["gebruiker_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_vordering: {
        Row: {
          completed_at: string | null
          created_at: string | null
          gebruiker_id: string | null
          id: string
          is_voltooi: boolean | null
          kursus_id: string | null
          les_id: string | null
          status: string | null
          toets_geslaag: boolean | null
          toets_maksimum: number | null
          toets_telling: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          gebruiker_id?: string | null
          id?: string
          is_voltooi?: boolean | null
          kursus_id?: string | null
          les_id?: string | null
          status?: string | null
          toets_geslaag?: boolean | null
          toets_maksimum?: number | null
          toets_telling?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          gebruiker_id?: string | null
          id?: string
          is_voltooi?: boolean | null
          kursus_id?: string | null
          les_id?: string | null
          status?: string | null
          toets_geslaag?: boolean | null
          toets_maksimum?: number | null
          toets_telling?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_vordering_gebruiker_id_fkey"
            columns: ["gebruiker_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_vordering_kursus_id_fkey"
            columns: ["kursus_id"]
            isOneToOne: false
            referencedRelation: "lms_kursusse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_vordering_les_id_fkey"
            columns: ["les_id"]
            isOneToOne: false
            referencedRelation: "lms_lesse"
            referencedColumns: ["id"]
          },
        ]
      }
      musiek_liedere: {
        Row: {
          ai_diens: string | null
          bladmusiek_pad: string | null
          created_at: string | null
          fout_boodskap: string | null
          id: string
          lirieke: string | null
          opgelaai_deur: string | null
          oudio_pad: string | null
          oudio_url: string | null
          replicate_taak_id: string | null
          status: string
          styl_prompt: string | null
          suno_taak_id: string | null
          tempo: number | null
          titel: string
          updated_at: string | null
          verwysing_oudio_pad: string | null
        }
        Insert: {
          ai_diens?: string | null
          bladmusiek_pad?: string | null
          created_at?: string | null
          fout_boodskap?: string | null
          id?: string
          lirieke?: string | null
          opgelaai_deur?: string | null
          oudio_pad?: string | null
          oudio_url?: string | null
          replicate_taak_id?: string | null
          status?: string
          styl_prompt?: string | null
          suno_taak_id?: string | null
          tempo?: number | null
          titel: string
          updated_at?: string | null
          verwysing_oudio_pad?: string | null
        }
        Update: {
          ai_diens?: string | null
          bladmusiek_pad?: string | null
          created_at?: string | null
          fout_boodskap?: string | null
          id?: string
          lirieke?: string | null
          opgelaai_deur?: string | null
          oudio_pad?: string | null
          oudio_url?: string | null
          replicate_taak_id?: string | null
          status?: string
          styl_prompt?: string | null
          suno_taak_id?: string | null
          tempo?: number | null
          titel?: string
          updated_at?: string | null
          verwysing_oudio_pad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "musiek_liedere_opgelaai_deur_fkey"
            columns: ["opgelaai_deur"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          announcements: boolean | null
          created_at: string | null
          crisis_alerts: boolean | null
          dagstukkies: boolean | null
          email_notifications: boolean | null
          event_reminders: boolean | null
          pastoral_updates: boolean | null
          payment_reminders: boolean | null
          sms_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          announcements?: boolean | null
          created_at?: string | null
          crisis_alerts?: boolean | null
          dagstukkies?: boolean | null
          email_notifications?: boolean | null
          event_reminders?: boolean | null
          pastoral_updates?: boolean | null
          payment_reminders?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          announcements?: boolean | null
          created_at?: string | null
          crisis_alerts?: boolean | null
          dagstukkies?: boolean | null
          email_notifications?: boolean | null
          event_reminders?: boolean | null
          pastoral_updates?: boolean | null
          payment_reminders?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          gemeente_id: string | null
          id: string
          priority: string | null
          sent_at: string | null
          sent_by: string | null
          target_audience: string | null
          target_wyk_id: string | null
          title: string
          total_sent: number | null
          type: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          gemeente_id?: string | null
          id?: string
          priority?: string | null
          sent_at?: string | null
          sent_by?: string | null
          target_audience?: string | null
          target_wyk_id?: string | null
          title: string
          total_sent?: number | null
          type?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          gemeente_id?: string | null
          id?: string
          priority?: string | null
          sent_at?: string | null
          sent_by?: string | null
          target_audience?: string | null
          target_wyk_id?: string | null
          title?: string
          total_sent?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_gemeente_id_fkey"
            columns: ["gemeente_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      omsendbrief_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          dokument_id: string
          embedding: string | null
          id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          dokument_id: string
          embedding?: string | null
          id?: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          dokument_id?: string
          embedding?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "omsendbrief_chunks_dokument_id_fkey"
            columns: ["dokument_id"]
            isOneToOne: false
            referencedRelation: "omsendbrief_dokumente"
            referencedColumns: ["id"]
          },
        ]
      }
      omsendbrief_dokumente: {
        Row: {
          chunk_count: number | null
          content: string | null
          created_at: string | null
          error_message: string | null
          file_size: number | null
          filename: string
          id: string
          metadata: Json | null
          mime_type: string | null
          original_file_url: string | null
          status: string | null
          storage_path: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          chunk_count?: number | null
          content?: string | null
          created_at?: string | null
          error_message?: string | null
          file_size?: number | null
          filename: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          original_file_url?: string | null
          status?: string | null
          storage_path?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          chunk_count?: number | null
          content?: string | null
          created_at?: string | null
          error_message?: string | null
          file_size?: number | null
          filename?: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          original_file_url?: string | null
          status?: string | null
          storage_path?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "omsendbrief_dokumente_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      omsendbrief_vrae: {
        Row: {
          antwoord: string | null
          asked_at: string | null
          bron_chunk_ids: string[] | null
          gebruiker_id: string | null
          gemeente_id: string | null
          id: string
          vraag: string
        }
        Insert: {
          antwoord?: string | null
          asked_at?: string | null
          bron_chunk_ids?: string[] | null
          gebruiker_id?: string | null
          gemeente_id?: string | null
          id?: string
          vraag: string
        }
        Update: {
          antwoord?: string | null
          asked_at?: string | null
          bron_chunk_ids?: string[] | null
          gebruiker_id?: string | null
          gemeente_id?: string | null
          id?: string
          vraag?: string
        }
        Relationships: [
          {
            foreignKeyName: "omsendbrief_vrae_gebruiker_id_fkey"
            columns: ["gebruiker_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "omsendbrief_vrae_gemeente_id_fkey"
            columns: ["gemeente_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
        ]
      }
      oordrag_versoeke: {
        Row: {
          admin_notas: string | null
          ander_kerk_adres: string | null
          ander_kerk_naam: string | null
          bestemming_gemeente_id: string | null
          bestemming_gemeente_naam: string | null
          created_at: string | null
          gemeente_id: string | null
          id: string
          lidmaat_id: string | null
          oordrag_tipe: string
          rede: string | null
          status: string
          updated_at: string | null
          verwerk_datum: string | null
          verwerk_deur: string | null
        }
        Insert: {
          admin_notas?: string | null
          ander_kerk_adres?: string | null
          ander_kerk_naam?: string | null
          bestemming_gemeente_id?: string | null
          bestemming_gemeente_naam?: string | null
          created_at?: string | null
          gemeente_id?: string | null
          id?: string
          lidmaat_id?: string | null
          oordrag_tipe?: string
          rede?: string | null
          status?: string
          updated_at?: string | null
          verwerk_datum?: string | null
          verwerk_deur?: string | null
        }
        Update: {
          admin_notas?: string | null
          ander_kerk_adres?: string | null
          ander_kerk_naam?: string | null
          bestemming_gemeente_id?: string | null
          bestemming_gemeente_naam?: string | null
          created_at?: string | null
          gemeente_id?: string | null
          id?: string
          lidmaat_id?: string | null
          oordrag_tipe?: string
          rede?: string | null
          status?: string
          updated_at?: string | null
          verwerk_datum?: string | null
          verwerk_deur?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oordrag_versoeke_bestemming_gemeente_id_fkey"
            columns: ["bestemming_gemeente_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oordrag_versoeke_gemeente_id_fkey"
            columns: ["gemeente_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oordrag_versoeke_lidmaat_id_fkey"
            columns: ["lidmaat_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oordrag_versoeke_verwerk_deur_fkey"
            columns: ["verwerk_deur"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      pastorale_aksies: {
        Row: {
          created_at: string | null
          datum: string
          gebruiker_id: string | null
          gemeente_id: string | null
          id: string
          leier_id: string | null
          nota: string | null
          tipe: string
        }
        Insert: {
          created_at?: string | null
          datum: string
          gebruiker_id?: string | null
          gemeente_id?: string | null
          id?: string
          leier_id?: string | null
          nota?: string | null
          tipe: string
        }
        Update: {
          created_at?: string | null
          datum?: string
          gebruiker_id?: string | null
          gemeente_id?: string | null
          id?: string
          leier_id?: string | null
          nota?: string | null
          tipe?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean | null
          address_city: string | null
          address_code: string | null
          address_country: string | null
          address_street: string | null
          address_suburb: string | null
          alternative_email: string | null
          app_roles: string[] | null
          baptism_date: string | null
          cellphone: string
          confirmation_date: string | null
          congregation_id: string
          created_at: string | null
          date_of_birth: string | null
          datum_oorlede: string | null
          datum_verhuis: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          first_name: string
          gender: string | null
          home_phone: string | null
          id: string
          id_number: string | null
          lidmaat_status: string | null
          marital_status: string | null
          membership_date: string | null
          noemnaam: string | null
          nooiensvan: string | null
          notes: string | null
          photo_url: string | null
          portfolio: string | null
          second_name: string | null
          spouse_name: string | null
          surname: string
          third_name: string | null
          titel: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          voorletters: string | null
          work_phone: string | null
        }
        Insert: {
          active?: boolean | null
          address_city?: string | null
          address_code?: string | null
          address_country?: string | null
          address_street?: string | null
          address_suburb?: string | null
          alternative_email?: string | null
          app_roles?: string[] | null
          baptism_date?: string | null
          cellphone: string
          confirmation_date?: string | null
          congregation_id: string
          created_at?: string | null
          date_of_birth?: string | null
          datum_oorlede?: string | null
          datum_verhuis?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name: string
          gender?: string | null
          home_phone?: string | null
          id?: string
          id_number?: string | null
          lidmaat_status?: string | null
          marital_status?: string | null
          membership_date?: string | null
          noemnaam?: string | null
          nooiensvan?: string | null
          notes?: string | null
          photo_url?: string | null
          portfolio?: string | null
          second_name?: string | null
          spouse_name?: string | null
          surname: string
          third_name?: string | null
          titel?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          voorletters?: string | null
          work_phone?: string | null
        }
        Update: {
          active?: boolean | null
          address_city?: string | null
          address_code?: string | null
          address_country?: string | null
          address_street?: string | null
          address_suburb?: string | null
          alternative_email?: string | null
          app_roles?: string[] | null
          baptism_date?: string | null
          cellphone?: string
          confirmation_date?: string | null
          congregation_id?: string
          created_at?: string | null
          date_of_birth?: string | null
          datum_oorlede?: string | null
          datum_verhuis?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string
          gender?: string | null
          home_phone?: string | null
          id?: string
          id_number?: string | null
          lidmaat_status?: string | null
          marital_status?: string | null
          membership_date?: string | null
          noemnaam?: string | null
          nooiensvan?: string | null
          notes?: string | null
          photo_url?: string | null
          portfolio?: string | null
          second_name?: string | null
          spouse_name?: string | null
          surname?: string
          third_name?: string | null
          titel?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          voorletters?: string | null
          work_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string | null
          user_id: string
        }
        Insert: {
          auth?: string | null
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh?: string | null
          user_id: string
        }
        Update: {
          auth?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      sys_menu_layouts: {
        Row: {
          gemeente_id: string | null
          id: string
          layout: Json
          role: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          gemeente_id?: string | null
          id?: string
          layout?: Json
          role: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          gemeente_id?: string | null
          id?: string
          layout?: Json
          role?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sys_menu_layouts_gemeente_id_fkey"
            columns: ["gemeente_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sys_menu_layouts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      vbo_aktiwiteite: {
        Row: {
          aktief: boolean | null
          beskrywing: string
          bewyse_verplig: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          krediete: number
          kursus_id: string | null
          tipe: string
          titel: string
          updated_at: string | null
        }
        Insert: {
          aktief?: boolean | null
          beskrywing: string
          bewyse_verplig?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          krediete?: number
          kursus_id?: string | null
          tipe: string
          titel: string
          updated_at?: string | null
        }
        Update: {
          aktief?: boolean | null
          beskrywing?: string
          bewyse_verplig?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          krediete?: number
          kursus_id?: string | null
          tipe?: string
          titel?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vbo_aktiwiteite_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vbo_aktiwiteite_kursus_id_fkey"
            columns: ["kursus_id"]
            isOneToOne: false
            referencedRelation: "lms_kursusse"
            referencedColumns: ["id"]
          },
        ]
      }
      vbo_historiese_punte: {
        Row: {
          beskrywing: string | null
          created_at: string | null
          csv_naam: string | null
          csv_van: string | null
          id: string
          jaar: number
          predikant_id: string | null
          punte: number
          updated_at: string | null
        }
        Insert: {
          beskrywing?: string | null
          created_at?: string | null
          csv_naam?: string | null
          csv_van?: string | null
          id?: string
          jaar: number
          predikant_id?: string | null
          punte?: number
          updated_at?: string | null
        }
        Update: {
          beskrywing?: string | null
          created_at?: string | null
          csv_naam?: string | null
          csv_van?: string | null
          id?: string
          jaar?: number
          predikant_id?: string | null
          punte?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vbo_historiese_punte_predikant_id_fkey"
            columns: ["predikant_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      vbo_indienings: {
        Row: {
          aktiwiteit_id: string
          aktiwiteit_tipe: string
          aktiwiteit_titel: string
          bewys_naam: string | null
          bewys_url: string | null
          created_at: string | null
          goedgekeur_op: string | null
          id: string
          is_outomaties: boolean | null
          jaar: number
          krediete: number
          kursus_id: string | null
          moderator_id: string | null
          moderator_notas: string | null
          notas: string | null
          predikant_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          aktiwiteit_id: string
          aktiwiteit_tipe: string
          aktiwiteit_titel: string
          bewys_naam?: string | null
          bewys_url?: string | null
          created_at?: string | null
          goedgekeur_op?: string | null
          id?: string
          is_outomaties?: boolean | null
          jaar: number
          krediete?: number
          kursus_id?: string | null
          moderator_id?: string | null
          moderator_notas?: string | null
          notas?: string | null
          predikant_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          aktiwiteit_id?: string
          aktiwiteit_tipe?: string
          aktiwiteit_titel?: string
          bewys_naam?: string | null
          bewys_url?: string | null
          created_at?: string | null
          goedgekeur_op?: string | null
          id?: string
          is_outomaties?: boolean | null
          jaar?: number
          krediete?: number
          kursus_id?: string | null
          moderator_id?: string | null
          moderator_notas?: string | null
          notas?: string | null
          predikant_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vbo_indienings_aktiwiteit_id_fkey"
            columns: ["aktiwiteit_id"]
            isOneToOne: false
            referencedRelation: "vbo_aktiwiteite"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vbo_indienings_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vbo_indienings_predikant_id_fkey"
            columns: ["predikant_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      vbo_punte: {
        Row: {
          beskrywing: string | null
          bewys_url: string | null
          created_at: string | null
          datum: string | null
          gebruiker_id: string
          id: string
          punte: number | null
          status: string | null
          tipe: string
        }
        Insert: {
          beskrywing?: string | null
          bewys_url?: string | null
          created_at?: string | null
          datum?: string | null
          gebruiker_id: string
          id?: string
          punte?: number | null
          status?: string | null
          tipe: string
        }
        Update: {
          beskrywing?: string | null
          bewys_url?: string | null
          created_at?: string | null
          datum?: string | null
          gebruiker_id?: string
          id?: string
          punte?: number | null
          status?: string | null
          tipe?: string
        }
        Relationships: []
      }
      vrae: {
        Row: {
          antwoord: string | null
          beantwoord_deur: string | null
          created_at: string | null
          gebruiker_id: string | null
          gemeente_id: string | null
          id: string
          inhoud: string
          kategorie: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          antwoord?: string | null
          beantwoord_deur?: string | null
          created_at?: string | null
          gebruiker_id?: string | null
          gemeente_id?: string | null
          id?: string
          inhoud: string
          kategorie: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          antwoord?: string | null
          beantwoord_deur?: string | null
          created_at?: string | null
          gebruiker_id?: string | null
          gemeente_id?: string | null
          id?: string
          inhoud?: string
          kategorie?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wyke: {
        Row: {
          beskrywing: string | null
          created_at: string | null
          gemeente_id: string | null
          id: string
          leier_id: string | null
          naam: string
          updated_at: string | null
        }
        Insert: {
          beskrywing?: string | null
          created_at?: string | null
          gemeente_id?: string | null
          id?: string
          leier_id?: string | null
          naam: string
          updated_at?: string | null
        }
        Update: {
          beskrywing?: string | null
          created_at?: string | null
          gemeente_id?: string | null
          id?: string
          leier_id?: string | null
          naam?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wyke_gemeente_id_fkey"
            columns: ["gemeente_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wyke_leier_id_fkey"
            columns: ["leier_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      congregation_statistics_with_growth: {
        Row: {
          baptisms: number | null
          baptized_members: number | null
          births: number | null
          confessing_members: number | null
          confirmations: number | null
          congregation_id: string | null
          created_at: string | null
          created_by: string | null
          deaths: number | null
          growth: number | null
          growth_percentage: number | null
          id: string | null
          notes: string | null
          previous_year_total: number | null
          total_souls: number | null
          transfers_in: number | null
          transfers_out: number | null
          updated_at: string | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "congregation_statistics_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "gemeentes"
            referencedColumns: ["id"]
          },
        ]
      }
      geloofsonderrig_leaderboard: {
        Row: {
          leerder_id: string | null
          rang: number | null
          totaal_punte: number | null
        }
        Relationships: [
          {
            foreignKeyName: "geloofsonderrig_punte_leerder_id_fkey"
            columns: ["leerder_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
        ]
      }
      geloofsonderrig_skav_opsomming: {
        Row: {
          gesindheid_telling: number | null
          kennis_telling: number | null
          laaste_opdatering: string | null
          leemtes: string[] | null
          leerder_id: string | null
          les_id: string | null
          sterkpunte: string[] | null
          vaardighede_telling: number | null
          waardes_telling: number | null
        }
        Relationships: [
          {
            foreignKeyName: "geloofsonderrig_ai_logs_leerder_id_fkey"
            columns: ["leerder_id"]
            isOneToOne: false
            referencedRelation: "gebruikers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geloofsonderrig_ai_logs_les_id_fkey"
            columns: ["les_id"]
            isOneToOne: false
            referencedRelation: "geloofsonderrig_lesse"
            referencedColumns: ["id"]
          },
        ]
      }
      non_compliant_inventory: {
        Row: {
          compliance_notes: string | null
          date_from: string | null
          date_to: string | null
          format: string | null
          gemeente_naam: string | null
          is_compliant: boolean | null
          issue_type: string | null
          item_category: string | null
          item_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_artikel_indiening: {
        Args: { p_gebruiker_id: string; p_indiening_id: string }
        Returns: undefined
      }
      get_compliant_congregations_count: { Args: never; Returns: number }
      get_geloofsonderrig_leaderboard_admin: {
        Args: { p_admin_id?: string }
        Returns: {
          leerder_id: string
          naam: string
          rang: number
          totaal_punte: number
          van: string
        }[]
      }
      get_geloofsonderrig_leaderboard_leerder: {
        Args: { p_leerder_id?: string }
        Returns: {
          is_current_user: boolean
          rang: number
          totaal_punte: number
        }[]
      }
      get_geloofsonderrig_leaderboard_public: {
        Args: never
        Returns: {
          is_current_user: boolean
          rang: number
          totaal_punte: number
        }[]
      }
      get_geloofsonderrig_vordering_leerder: {
        Args: { p_leerder_id: string }
        Returns: {
          created_at: string | null
          id: string
          leerder_id: string | null
          les_id: string | null
          onderwerp_id: string | null
          persentasie: number | null
          quiz_score: number | null
          quiz_total: number | null
          updated_at: string | null
          verse_completed: number | null
          verse_total: number | null
          visualiserings_count: number | null
          voltooi: boolean | null
        }[]
        SetofOptions: {
          from: "*"
          to: "geloofsonderrig_vordering"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_geloofsonderrig_rank: {
        Args: never
        Returns: {
          rang: number
          totaal_punte: number
        }[]
      }
      get_my_role: { Args: never; Returns: string }
      get_total_church_souls: { Args: never; Returns: number }
      initialize_congregation_inventory: {
        Args: { cong_id: string }
        Returns: undefined
      }
      insert_geloofsonderrig_punte_leerder: {
        Args: {
          p_aksie_tipe: string
          p_leerder_id: string
          p_les_id?: string
          p_punte: number
        }
        Returns: undefined
      }
      match_omsendbrief_chunks:
        | {
            Args: {
              match_count?: number
              match_threshold?: number
              p_filter_year?: number
              query_embedding: string
            }
            Returns: {
              content: string
              dokument_id: string
              id: string
              similarity: number
            }[]
          }
        | {
            Args: { match_count?: number; query_embedding: string }
            Returns: {
              content: string
              dokument_id: string
              id: string
              similarity: number
            }[]
          }
      omsendbrief_hybrid_search: {
        Args: {
          p_filter_year?: number
          p_fts_weight?: number
          p_limit?: number
          p_query_embedding: string
          p_query_text: string
          p_vector_weight?: number
        }
        Returns: {
          chunk_id: string
          combined_score: number
          content: string
          document_title: string
          dokument_id: string
          filename: string
          fts_rank: number
          original_file_url: string
          similarity: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      upsert_geloofsonderrig_vordering_leerder: {
        Args: {
          p_leerder_id: string
          p_les_id: string
          p_quiz_score?: number
          p_quiz_total?: number
          p_verse_completed?: number
          p_verse_total?: number
          p_visualiserings_count?: number
          p_voltooi: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
