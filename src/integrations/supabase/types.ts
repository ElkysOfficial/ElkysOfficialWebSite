export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          before_data: Json | null;
          after_data: Json | null;
          reason: string | null;
          actor_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          action: string;
          before_data?: Json | null;
          after_data?: Json | null;
          reason?: string | null;
          actor_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          action?: string;
          before_data?: Json | null;
          after_data?: Json | null;
          reason?: string | null;
          actor_user_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          address: string | null;
          bairro: string | null;
          cargo_representante: string | null;
          cep: string | null;
          city: string | null;
          complemento: string | null;
          logradouro: string | null;
          numero: string | null;
          client_origin: Database["public"]["Enums"]["client_origin"] | null;
          client_since: string;
          client_type: string;
          cnpj: string | null;
          contract_end: string | null;
          contract_start: string | null;
          contract_status: Database["public"]["Enums"]["contract_status"] | null;
          contract_type: Database["public"]["Enums"]["contract_type"] | null;
          country: string;
          cpf: string;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          is_active: boolean;
          monthly_value: number;
          must_change_password: boolean;
          nome_fantasia: string | null;
          payment_due_day: number | null;
          phone: string | null;
          project_total_value: number;
          razao_social: string | null;
          scope_summary: string | null;
          state: string | null;
          tags: string[];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          address?: string | null;
          bairro?: string | null;
          cargo_representante?: string | null;
          cep?: string | null;
          city?: string | null;
          complemento?: string | null;
          logradouro?: string | null;
          numero?: string | null;
          client_origin?: Database["public"]["Enums"]["client_origin"] | null;
          client_since?: string;
          client_type?: string;
          cnpj?: string | null;
          contract_end?: string | null;
          contract_start?: string | null;
          contract_status?: Database["public"]["Enums"]["contract_status"] | null;
          contract_type?: Database["public"]["Enums"]["contract_type"] | null;
          country?: string;
          cpf: string;
          created_at?: string;
          email: string;
          full_name: string;
          id?: string;
          is_active?: boolean;
          monthly_value?: number;
          must_change_password?: boolean;
          nome_fantasia?: string | null;
          payment_due_day?: number | null;
          phone?: string | null;
          project_total_value?: number;
          razao_social?: string | null;
          scope_summary?: string | null;
          state?: string | null;
          tags?: string[];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          address?: string | null;
          bairro?: string | null;
          cargo_representante?: string | null;
          cep?: string | null;
          city?: string | null;
          complemento?: string | null;
          logradouro?: string | null;
          numero?: string | null;
          client_origin?: Database["public"]["Enums"]["client_origin"] | null;
          client_since?: string;
          client_type?: string;
          cnpj?: string | null;
          contract_end?: string | null;
          contract_start?: string | null;
          contract_status?: Database["public"]["Enums"]["contract_status"] | null;
          contract_type?: Database["public"]["Enums"]["contract_type"] | null;
          country?: string;
          cpf?: string;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          monthly_value?: number;
          must_change_password?: boolean;
          nome_fantasia?: string | null;
          payment_due_day?: number | null;
          phone?: string | null;
          project_total_value?: number;
          razao_social?: string | null;
          scope_summary?: string | null;
          state?: string | null;
          tags?: string[];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      client_contacts: {
        Row: {
          auth_user_id: string | null;
          client_id: string;
          cpf: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          is_legal_representative: boolean;
          is_primary: boolean;
          phone: string | null;
          receives_finance: boolean;
          role_label: string | null;
          updated_at: string;
        };
        Insert: {
          auth_user_id?: string | null;
          client_id: string;
          cpf?: string | null;
          created_at?: string;
          email: string;
          full_name: string;
          id?: string;
          is_legal_representative?: boolean;
          is_primary?: boolean;
          phone?: string | null;
          receives_finance?: boolean;
          role_label?: string | null;
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string | null;
          client_id?: string;
          cpf?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          is_legal_representative?: boolean;
          is_primary?: boolean;
          phone?: string | null;
          receives_finance?: boolean;
          role_label?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_contacts_auth_user_id_fkey";
            columns: ["auth_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_contacts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      support_tickets: {
        Row: {
          body: string;
          category: string;
          client_id: string;
          created_at: string;
          first_response_at: string | null;
          id: string;
          internal_notes: string | null;
          priority: string;
          project_id: string | null;
          rated_at: string | null;
          rating: number | null;
          rating_feedback: string | null;
          resolved_at: string | null;
          status: string;
          subject: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          category?: string;
          client_id: string;
          created_at?: string;
          first_response_at?: string | null;
          id?: string;
          internal_notes?: string | null;
          priority?: string;
          project_id?: string | null;
          rated_at?: string | null;
          rating?: number | null;
          rating_feedback?: string | null;
          resolved_at?: string | null;
          status?: string;
          subject: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          category?: string;
          client_id?: string;
          created_at?: string;
          first_response_at?: string | null;
          id?: string;
          internal_notes?: string | null;
          priority?: string;
          project_id?: string | null;
          rated_at?: string | null;
          rating?: number | null;
          rating_feedback?: string | null;
          resolved_at?: string | null;
          status?: string;
          subject?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "support_tickets_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "support_tickets_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      billing_actions_log: {
        Row: {
          id: string;
          charge_id: string;
          rule_id: string | null;
          action_type: string;
          template_id: string | null;
          sent_at: string;
          status: string;
          error_message: string | null;
          triggered_by: string;
        };
        Insert: {
          id?: string;
          charge_id: string;
          rule_id?: string | null;
          action_type: string;
          template_id?: string | null;
          sent_at?: string;
          status?: string;
          error_message?: string | null;
          triggered_by?: string;
        };
        Update: {
          id?: string;
          charge_id?: string;
          rule_id?: string | null;
          action_type?: string;
          template_id?: string | null;
          sent_at?: string;
          status?: string;
          error_message?: string | null;
          triggered_by?: string;
        };
        Relationships: [];
      };
      billing_rules: {
        Row: {
          id: string;
          name: string;
          trigger_days: number;
          action_type: string;
          template_id: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          trigger_days: number;
          action_type: string;
          template_id?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          trigger_days?: number;
          action_type?: string;
          template_id?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      billing_templates: {
        Row: {
          id: string;
          name: string;
          subject: string;
          body: string;
          type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subject: string;
          body: string;
          type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subject?: string;
          body?: string;
          type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      charges: {
        Row: {
          amount: number;
          client_id: string;
          contract_id: string | null;
          created_at: string;
          description: string;
          due_date: string;
          id: string;
          installment_id: string | null;
          is_blocking: boolean;
          is_historical: boolean;
          origin_type: string;
          paid_at: string | null;
          payment_link: string | null;
          payment_reference: string | null;
          project_id: string | null;
          status: Database["public"]["Enums"]["invoice_status"];
          subscription_id: string | null;
          updated_at: string;
        };
        Insert: {
          amount: number;
          client_id: string;
          contract_id?: string | null;
          created_at?: string;
          description: string;
          due_date: string;
          id?: string;
          installment_id?: string | null;
          is_blocking?: boolean;
          is_historical?: boolean;
          origin_type: string;
          paid_at?: string | null;
          payment_link?: string | null;
          payment_reference?: string | null;
          project_id?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          subscription_id?: string | null;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          client_id?: string;
          contract_id?: string | null;
          created_at?: string;
          description?: string;
          due_date?: string;
          id?: string;
          installment_id?: string | null;
          is_blocking?: boolean;
          is_historical?: boolean;
          origin_type?: string;
          paid_at?: string | null;
          payment_link?: string | null;
          payment_reference?: string | null;
          project_id?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          subscription_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "charges_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "charges_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "project_contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "charges_installment_id_fkey";
            columns: ["installment_id"];
            isOneToOne: false;
            referencedRelation: "project_installments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "charges_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "charges_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "project_subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          archived_at: string | null;
          client_id: string;
          contract_id: string | null;
          created_at: string;
          description: string | null;
          external_url: string | null;
          id: string;
          label: string;
          project_id: string | null;
          storage_path: string | null;
          type: Database["public"]["Enums"]["document_type"];
          uploaded_by: string | null;
          url: string;
          visibility: Database["public"]["Enums"]["document_visibility"];
        };
        Insert: {
          archived_at?: string | null;
          client_id: string;
          contract_id?: string | null;
          created_at?: string;
          description?: string | null;
          external_url?: string | null;
          id?: string;
          label: string;
          project_id?: string | null;
          storage_path?: string | null;
          type: Database["public"]["Enums"]["document_type"];
          uploaded_by?: string | null;
          url: string;
          visibility?: Database["public"]["Enums"]["document_visibility"];
        };
        Update: {
          archived_at?: string | null;
          client_id?: string;
          contract_id?: string | null;
          created_at?: string;
          description?: string | null;
          external_url?: string | null;
          id?: string;
          label?: string;
          project_id?: string | null;
          storage_path?: string | null;
          type?: Database["public"]["Enums"]["document_type"];
          uploaded_by?: string | null;
          url?: string;
          visibility?: Database["public"]["Enums"]["document_visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "project_contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      internal_team_documents: {
        Row: {
          audience: string;
          created_at: string;
          created_by: string | null;
          id: string;
          label: string;
          type_label: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          audience: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          label: string;
          type_label: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          audience?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          label?: string;
          type_label?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          description: string;
          expense_date: string;
          id: string;
          notes: string | null;
        };
        Insert: {
          amount: number;
          category?: string;
          created_at?: string;
          description: string;
          expense_date?: string;
          id?: string;
          notes?: string | null;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          description?: string;
          expense_date?: string;
          id?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      financial_goals: {
        Row: {
          id: string;
          period_type: string;
          period_start: string;
          period_end: string;
          target_amount: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          period_type: string;
          period_start: string;
          period_end: string;
          target_amount: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          period_type?: string;
          period_start?: string;
          period_end?: string;
          target_amount?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lead_interactions: {
        Row: {
          id: string;
          lead_id: string;
          type: string;
          notes: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          type: string;
          notes: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          type?: string;
          notes?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          source: string;
          status: string;
          estimated_value: number;
          probability: number;
          assigned_to: string | null;
          notes: string | null;
          lost_reason: string | null;
          converted_client_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          source?: string;
          status?: string;
          estimated_value?: number;
          probability?: number;
          assigned_to?: string | null;
          notes?: string | null;
          lost_reason?: string | null;
          converted_client_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          source?: string;
          status?: string;
          estimated_value?: number;
          probability?: number;
          assigned_to?: string | null;
          notes?: string | null;
          lost_reason?: string | null;
          converted_client_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      marketing_calendar_events: {
        Row: {
          all_day: boolean;
          channel: string | null;
          client_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_at: string;
          event_type: string;
          id: string;
          project_id: string | null;
          starts_at: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          all_day?: boolean;
          channel?: string | null;
          client_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at: string;
          event_type?: string;
          id?: string;
          project_id?: string | null;
          starts_at: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          all_day?: boolean;
          channel?: string | null;
          client_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string;
          event_type?: string;
          id?: string;
          project_id?: string | null;
          starts_at?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketing_calendar_events_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketing_calendar_events_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_position_x: number;
          avatar_position_y: number;
          avatar_url: string | null;
          avatar_zoom: number;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          is_active: boolean;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_position_x?: number;
          avatar_position_y?: number;
          avatar_url?: string | null;
          avatar_zoom?: number;
          created_at?: string;
          email?: string;
          full_name?: string;
          id: string;
          is_active?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_position_x?: number;
          avatar_position_y?: number;
          avatar_url?: string | null;
          avatar_zoom?: number;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_contracts: {
        Row: {
          client_id: string;
          created_at: string;
          created_by: string | null;
          ends_at: string | null;
          id: string;
          payment_model: Database["public"]["Enums"]["payment_model"];
          project_id: string;
          scope_summary: string | null;
          signed_at: string | null;
          starts_at: string | null;
          status: Database["public"]["Enums"]["contract_record_status"];
          total_amount: number;
          updated_at: string;
          version_no: number;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          id?: string;
          payment_model?: Database["public"]["Enums"]["payment_model"];
          project_id: string;
          scope_summary?: string | null;
          signed_at?: string | null;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["contract_record_status"];
          total_amount?: number;
          updated_at?: string;
          version_no?: number;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          id?: string;
          payment_model?: Database["public"]["Enums"]["payment_model"];
          project_id?: string;
          scope_summary?: string | null;
          signed_at?: string | null;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["contract_record_status"];
          total_amount?: number;
          updated_at?: string;
          version_no?: number;
        };
        Relationships: [
          {
            foreignKeyName: "project_contracts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_contracts_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_installments: {
        Row: {
          amount: number;
          client_id: string;
          contract_id: string;
          created_at: string;
          effective_due_date: string | null;
          expected_due_date: string | null;
          id: string;
          installment_type: Database["public"]["Enums"]["project_installment_type"];
          is_blocking: boolean;
          paid_at: string | null;
          percentage: number;
          project_id: string;
          status: Database["public"]["Enums"]["project_installment_status"];
          trigger_type: Database["public"]["Enums"]["project_installment_trigger"];
          updated_at: string;
        };
        Insert: {
          amount: number;
          client_id: string;
          contract_id: string;
          created_at?: string;
          effective_due_date?: string | null;
          expected_due_date?: string | null;
          id?: string;
          installment_type: Database["public"]["Enums"]["project_installment_type"];
          is_blocking?: boolean;
          paid_at?: string | null;
          percentage: number;
          project_id: string;
          status?: Database["public"]["Enums"]["project_installment_status"];
          trigger_type?: Database["public"]["Enums"]["project_installment_trigger"];
          updated_at?: string;
        };
        Update: {
          amount?: number;
          client_id?: string;
          contract_id?: string;
          created_at?: string;
          effective_due_date?: string | null;
          expected_due_date?: string | null;
          id?: string;
          installment_type?: Database["public"]["Enums"]["project_installment_type"];
          is_blocking?: boolean;
          paid_at?: string | null;
          percentage?: number;
          project_id?: string;
          status?: Database["public"]["Enums"]["project_installment_status"];
          trigger_type?: Database["public"]["Enums"]["project_installment_trigger"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_installments_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_installments_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "project_contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_installments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_next_steps: {
        Row: {
          client_id: string;
          client_visible: boolean;
          created_at: string;
          description: string | null;
          due_date: string | null;
          id: string;
          owner: Database["public"]["Enums"]["next_step_owner"];
          project_id: string;
          sort_order: number;
          status: Database["public"]["Enums"]["next_step_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          client_visible?: boolean;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          owner?: Database["public"]["Enums"]["next_step_owner"];
          project_id: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["next_step_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          client_visible?: boolean;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          owner?: Database["public"]["Enums"]["next_step_owner"];
          project_id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["next_step_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_next_steps_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_next_steps_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_subscriptions: {
        Row: {
          amount: number;
          client_id: string;
          created_at: string;
          due_day: number;
          ends_on: string | null;
          grace_days: number;
          id: string;
          is_blocking: boolean;
          label: string;
          project_id: string;
          starts_on: string;
          status: Database["public"]["Enums"]["subscription_status"];
          updated_at: string;
        };
        Insert: {
          amount: number;
          client_id: string;
          created_at?: string;
          due_day: number;
          ends_on?: string | null;
          grace_days?: number;
          id?: string;
          is_blocking?: boolean;
          label: string;
          project_id: string;
          starts_on?: string;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
        };
        Update: {
          amount?: number;
          client_id?: string;
          created_at?: string;
          due_day?: number;
          ends_on?: string | null;
          grace_days?: number;
          id?: string;
          is_blocking?: boolean;
          label?: string;
          project_id?: string;
          starts_on?: string;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_subscriptions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_subscriptions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      proposals: {
        Row: {
          id: string;
          client_id: string | null;
          lead_id: string | null;
          title: string;
          status: string;
          valid_until: string | null;
          total_amount: number;
          scope_summary: string | null;
          payment_conditions: string | null;
          observations: string | null;
          document_url: string | null;
          approved_at: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          sent_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          lead_id?: string | null;
          title: string;
          status?: string;
          valid_until?: string | null;
          total_amount?: number;
          scope_summary?: string | null;
          payment_conditions?: string | null;
          observations?: string | null;
          document_url?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          sent_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          lead_id?: string | null;
          title?: string;
          status?: string;
          valid_until?: string | null;
          total_amount?: number;
          scope_summary?: string | null;
          payment_conditions?: string | null;
          observations?: string | null;
          document_url?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          sent_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          archived_at: string | null;
          billing_type: Database["public"]["Enums"]["billing_type"];
          client_visible_summary: string | null;
          client_id: string;
          created_at: string;
          current_stage: string;
          delivered_at: string | null;
          description: string | null;
          expected_delivery_date: string | null;
          id: string;
          internal_notes: string | null;
          manual_status_override: boolean;
          name: string;
          pause_reason: Database["public"]["Enums"]["project_pause_reason"] | null;
          pause_source: Database["public"]["Enums"]["pause_source"] | null;
          solution_type: string | null;
          started_at: string;
          status: Database["public"]["Enums"]["project_status"];
          tags: string[];
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          billing_type?: Database["public"]["Enums"]["billing_type"];
          client_visible_summary?: string | null;
          client_id: string;
          created_at?: string;
          current_stage?: string;
          delivered_at?: string | null;
          description?: string | null;
          expected_delivery_date?: string | null;
          id?: string;
          internal_notes?: string | null;
          manual_status_override?: boolean;
          name: string;
          pause_reason?: Database["public"]["Enums"]["project_pause_reason"] | null;
          pause_source?: Database["public"]["Enums"]["pause_source"] | null;
          solution_type?: string | null;
          started_at?: string;
          status?: Database["public"]["Enums"]["project_status"];
          tags?: string[];
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          billing_type?: Database["public"]["Enums"]["billing_type"];
          client_visible_summary?: string | null;
          client_id?: string;
          created_at?: string;
          current_stage?: string;
          delivered_at?: string | null;
          description?: string | null;
          expected_delivery_date?: string | null;
          id?: string;
          internal_notes?: string | null;
          manual_status_override?: boolean;
          name?: string;
          pause_reason?: Database["public"]["Enums"]["project_pause_reason"] | null;
          pause_source?: Database["public"]["Enums"]["pause_source"] | null;
          solution_type?: string | null;
          started_at?: string;
          status?: Database["public"]["Enums"]["project_status"];
          tags?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      timeline_events: {
        Row: {
          actor_user_id: string | null;
          client_id: string;
          created_at: string;
          event_type: string;
          id: string;
          metadata: Json;
          occurred_at: string;
          project_id: string | null;
          source_id: string | null;
          source_table: string | null;
          summary: string;
          title: string;
          visibility: Database["public"]["Enums"]["document_visibility"];
        };
        Insert: {
          actor_user_id?: string | null;
          client_id: string;
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: Json;
          occurred_at?: string;
          project_id?: string | null;
          source_id?: string | null;
          source_table?: string | null;
          summary: string;
          title: string;
          visibility?: Database["public"]["Enums"]["document_visibility"];
        };
        Update: {
          actor_user_id?: string | null;
          client_id?: string;
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
          occurred_at?: string;
          project_id?: string | null;
          source_id?: string | null;
          source_table?: string | null;
          summary?: string;
          title?: string;
          visibility?: Database["public"]["Enums"]["document_visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "timeline_events_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timeline_events_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          title: string;
          body: string;
          type: Database["public"]["Enums"]["notification_type"];
          status: Database["public"]["Enums"]["notification_status"];
          send_at: string | null;
          sent_at: string | null;
          filter_mode: string;
          filter_tags: string[];
          filter_contract_status: string | null;
          filter_client_ids: string[];
          recipient_count: number;
          error_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          type?: Database["public"]["Enums"]["notification_type"];
          status?: Database["public"]["Enums"]["notification_status"];
          send_at?: string | null;
          sent_at?: string | null;
          filter_mode?: string;
          filter_tags?: string[];
          filter_contract_status?: string | null;
          filter_client_ids?: string[];
          recipient_count?: number;
          error_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          status?: Database["public"]["Enums"]["notification_status"];
          send_at?: string | null;
          sent_at?: string | null;
          filter_mode?: string;
          filter_tags?: string[];
          filter_contract_status?: string | null;
          filter_client_ids?: string[];
          recipient_count?: number;
          error_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_recipients: {
        Row: {
          id: string;
          notification_id: string;
          client_id: string;
          user_id: string | null;
          email_sent: boolean;
          email_error: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          notification_id: string;
          client_id: string;
          user_id?: string | null;
          email_sent?: boolean;
          email_error?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          notification_id?: string;
          client_id?: string;
          user_id?: string | null;
          email_sent?: boolean;
          email_error?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_recipients_notification_id_fkey";
            columns: ["notification_id"];
            isOneToOne: false;
            referencedRelation: "notifications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_recipients_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          is_active: boolean;
          must_change_password: boolean;
          phone: string | null;
          role_title: string;
          system_role: Database["public"]["Enums"]["app_role"] | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name: string;
          id?: string;
          is_active?: boolean;
          must_change_password?: boolean;
          phone?: string | null;
          role_title?: string;
          system_role?: Database["public"]["Enums"]["app_role"] | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          must_change_password?: boolean;
          phone?: string | null;
          role_title?: string;
          system_role?: Database["public"]["Enums"]["app_role"] | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_client_id_for_portal_user: { Args: { _user_id: string }; Returns: string };
      get_client_id_for_user: { Args: { _user_id: string }; Returns: string };
      has_any_team_role: { Args: { _user_id: string }; Returns: boolean };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      has_role_in: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: { _user_id: string }; Returns: boolean };
      mark_overdue_charges: { Args: Record<PropertyKey, never>; Returns: undefined };
      sync_financial_blocks: { Args: Record<PropertyKey, never>; Returns: undefined };
      sync_projects_from_blocking_charges: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "admin_super" | "admin" | "cliente" | "marketing" | "developer" | "support";
      billing_type: "mensal" | "projeto";
      client_origin: "lead" | "indicacao" | "inbound";
      contract_record_status: "rascunho" | "ativo" | "encerrado" | "cancelado";
      contract_status: "ativo" | "inadimplente" | "cancelado";
      notification_type: "manutencao" | "atualizacao" | "otimizacao" | "alerta" | "personalizado";
      notification_status: "rascunho" | "agendada" | "enviando" | "enviada" | "falha";
      contract_type: "projeto" | "recorrente" | "hibrido";
      document_visibility: "cliente" | "interno" | "ambos";
      document_type: "contrato" | "aditivo" | "nota_fiscal" | "codigo_fonte" | "outro";
      invoice_status: "agendada" | "pendente" | "pago" | "atrasado" | "cancelado";
      next_step_owner: "elkys" | "cliente" | "compartilhado";
      next_step_status: "pendente" | "em_andamento" | "concluido" | "cancelado";
      pause_source: "automatico" | "manual";
      payment_model: "50_50" | "a_vista" | "personalizado";
      project_installment_status: "agendada" | "pendente" | "paga" | "atrasada" | "cancelada";
      project_installment_trigger: "assinatura" | "conclusao" | "data_fixa";
      project_installment_type: "entrada" | "entrega";
      project_pause_reason: "financeiro" | "dependencia_cliente" | "interno" | "escopo" | "outro";
      project_status: "negociacao" | "em_andamento" | "concluido" | "pausado" | "cancelado";
      subscription_status: "agendada" | "ativa" | "pausada" | "encerrada";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin_super", "admin", "cliente", "marketing", "developer", "support"],
      billing_type: ["mensal", "projeto"],
      client_origin: ["lead", "indicacao", "inbound"],
      contract_record_status: ["rascunho", "ativo", "encerrado", "cancelado"],
      contract_status: ["ativo", "inadimplente", "cancelado"],
      contract_type: ["projeto", "recorrente", "hibrido"],
      document_visibility: ["cliente", "interno", "ambos"],
      document_type: ["contrato", "aditivo", "nota_fiscal", "codigo_fonte", "outro"],
      invoice_status: ["agendada", "pendente", "pago", "atrasado", "cancelado"],
      next_step_owner: ["elkys", "cliente", "compartilhado"],
      next_step_status: ["pendente", "em_andamento", "concluido", "cancelado"],
      pause_source: ["automatico", "manual"],
      payment_model: ["50_50", "a_vista", "personalizado"],
      project_installment_status: ["agendada", "pendente", "paga", "atrasada", "cancelada"],
      project_installment_trigger: ["assinatura", "conclusao", "data_fixa"],
      project_installment_type: ["entrada", "entrega"],
      project_pause_reason: ["financeiro", "dependencia_cliente", "interno", "escopo", "outro"],
      project_status: ["negociacao", "em_andamento", "concluido", "pausado", "cancelado"],
      subscription_status: ["agendada", "ativa", "pausada", "encerrada"],
    },
  },
} as const;
