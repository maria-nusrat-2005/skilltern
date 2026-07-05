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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_memory: {
        Row: {
          content: Json
          created_at: string
          embedding: string | null
          id: string
          memory_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          embedding?: string | null
          id?: string
          memory_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          embedding?: string | null
          id?: string
          memory_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      application_status_history: {
        Row: {
          application_id: string
          created_at: string
          id: string
          note: string | null
          status: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          note?: string | null
          status: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          note?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          board_position: number
          created_at: string
          deadline: string | null
          id: string
          internship_id: string
          interview_at: string | null
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board_position?: number
          created_at?: string
          deadline?: string | null
          id?: string
          internship_id: string
          interview_at?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board_position?: number
          created_at?: string
          deadline?: string | null
          id?: string
          internship_id?: string
          interview_at?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          internship_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          internship_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          internship_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      career_analysis: {
        Row: {
          ats_score: number | null
          career_domain: string | null
          career_stage: string | null
          created_at: string
          id: string
          industry_preference: string | null
          internship_readiness: number | null
          missing_skills: Json
          project_quality: number | null
          recommended_projects: Json
          recommended_roles: Json
          recommended_technologies: Json
          resume_id: string | null
          status: string
          strengths: Json
          technical_maturity: string | null
          updated_at: string
          user_id: string
          weaknesses: Json
        }
        Insert: {
          ats_score?: number | null
          career_domain?: string | null
          career_stage?: string | null
          created_at?: string
          id?: string
          industry_preference?: string | null
          internship_readiness?: number | null
          missing_skills?: Json
          project_quality?: number | null
          recommended_projects?: Json
          recommended_roles?: Json
          recommended_technologies?: Json
          resume_id?: string | null
          status?: string
          strengths?: Json
          technical_maturity?: string | null
          updated_at?: string
          user_id: string
          weaknesses?: Json
        }
        Update: {
          ats_score?: number | null
          career_domain?: string | null
          career_stage?: string | null
          created_at?: string
          id?: string
          industry_preference?: string | null
          internship_readiness?: number | null
          missing_skills?: Json
          project_quality?: number | null
          recommended_projects?: Json
          recommended_roles?: Json
          recommended_technologies?: Json
          resume_id?: string | null
          status?: string
          strengths?: Json
          technical_maturity?: string | null
          updated_at?: string
          user_id?: string
          weaknesses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "career_analysis_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      company_reviews: {
        Row: {
          author_label: string | null
          body: string | null
          company: string
          cons: string | null
          created_at: string
          id: string
          is_seed: boolean
          pros: string | null
          rating: number
          role: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_label?: string | null
          body?: string | null
          company: string
          cons?: string | null
          created_at?: string
          id?: string
          is_seed?: boolean
          pros?: string | null
          rating: number
          role?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_label?: string | null
          body?: string | null
          company?: string
          cons?: string | null
          created_at?: string
          id?: string
          is_seed?: boolean
          pros?: string | null
          rating?: number
          role?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      internship_embeddings: {
        Row: {
          created_at: string
          embedding: string | null
          internship_id: string
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          internship_id: string
        }
        Update: {
          created_at?: string
          embedding?: string | null
          internship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_embeddings_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: true
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_matches: {
        Row: {
          created_at: string
          estimated_effort: string | null
          experience_score: number
          explanation: string | null
          id: string
          industry_score: number
          internship_id: string
          learning_path: Json
          missing_skills: Json
          overall_score: number
          project_score: number
          recommendations: Json
          strengths: Json
          technical_score: number
          user_id: string
          weaknesses: Json
        }
        Insert: {
          created_at?: string
          estimated_effort?: string | null
          experience_score?: number
          explanation?: string | null
          id?: string
          industry_score?: number
          internship_id: string
          learning_path?: Json
          missing_skills?: Json
          overall_score?: number
          project_score?: number
          recommendations?: Json
          strengths?: Json
          technical_score?: number
          user_id: string
          weaknesses?: Json
        }
        Update: {
          created_at?: string
          estimated_effort?: string | null
          experience_score?: number
          explanation?: string | null
          id?: string
          industry_score?: number
          internship_id?: string
          learning_path?: Json
          missing_skills?: Json
          overall_score?: number
          project_score?: number
          recommendations?: Json
          strengths?: Json
          technical_score?: number
          user_id?: string
          weaknesses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "internship_matches_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          company: string
          company_domain: string | null
          company_type: string
          created_at: string
          description: string | null
          domain: string
          duration: string | null
          experience_level: string | null
          id: string
          industry: string | null
          location: string
          preferred_skills: Json
          requirements: Json
          responsibilities: Json
          salary: string | null
          tech_stack: Json
          title: string
          work_model: string | null
        }
        Insert: {
          company: string
          company_domain?: string | null
          company_type: string
          created_at?: string
          description?: string | null
          domain: string
          duration?: string | null
          experience_level?: string | null
          id?: string
          industry?: string | null
          location: string
          preferred_skills?: Json
          requirements?: Json
          responsibilities?: Json
          salary?: string | null
          tech_stack?: Json
          title: string
          work_model?: string | null
        }
        Update: {
          company?: string
          company_domain?: string | null
          company_type?: string
          created_at?: string
          description?: string | null
          domain?: string
          duration?: string | null
          experience_level?: string | null
          id?: string
          industry?: string | null
          location?: string
          preferred_skills?: Json
          requirements?: Json
          responsibilities?: Json
          salary?: string | null
          tech_stack?: Json
          title?: string
          work_model?: string | null
        }
        Relationships: []
      }
      parsed_resumes: {
        Row: {
          created_at: string
          data: Json
          id: string
          resume_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          resume_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          resume_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parsed_resumes_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_benchmarks: {
        Row: {
          applications_count: number
          ats_score: number
          created_at: string
          domain: string
          id: string
          project_quality: number
          readiness: number
          university: string | null
        }
        Insert: {
          applications_count?: number
          ats_score: number
          created_at?: string
          domain: string
          id?: string
          project_quality: number
          readiness: number
          university?: string | null
        }
        Update: {
          applications_count?: number
          ats_score?: number
          created_at?: string
          domain?: string
          id?: string
          project_quality?: number
          readiness?: number
          university?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          github_url: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          onboarding_completed: boolean
          phone: string | null
          portfolio_url: string | null
          profile_completion: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          portfolio_url?: string | null
          profile_completion?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          portfolio_url?: string | null
          profile_completion?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_recommendations: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          domain: string | null
          id: string
          related_internships: Json
          technologies: Json
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          domain?: string | null
          id?: string
          related_internships?: Json
          technologies?: Json
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          domain?: string | null
          id?: string
          related_internships?: Json
          technologies?: Json
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      resume_scores: {
        Row: {
          ats_score: number | null
          completeness: number | null
          created_at: string
          examples: Json
          formatting_score: number | null
          id: string
          measurable_impact: number | null
          overall_score: number | null
          project_quality: number | null
          recommendations: Json
          resume_id: string | null
          strengths: Json
          technical_depth: number | null
          user_id: string
          weaknesses: Json
        }
        Insert: {
          ats_score?: number | null
          completeness?: number | null
          created_at?: string
          examples?: Json
          formatting_score?: number | null
          id?: string
          measurable_impact?: number | null
          overall_score?: number | null
          project_quality?: number | null
          recommendations?: Json
          resume_id?: string | null
          strengths?: Json
          technical_depth?: number | null
          user_id: string
          weaknesses?: Json
        }
        Update: {
          ats_score?: number | null
          completeness?: number | null
          created_at?: string
          examples?: Json
          formatting_score?: number | null
          id?: string
          measurable_impact?: number | null
          overall_score?: number | null
          project_quality?: number | null
          recommendations?: Json
          resume_id?: string | null
          strengths?: Json
          technical_depth?: number | null
          user_id?: string
          weaknesses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "resume_scores_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          analysis_status: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_active: boolean
          label: string | null
          parsed: boolean
          target_domain: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_status?: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_active?: boolean
          label?: string | null
          parsed?: boolean
          target_domain?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_status?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_active?: boolean
          label?: string | null
          parsed?: boolean
          target_domain?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          last_seen_count: number
          name: string
          notify: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          last_seen_count?: number
          name: string
          notify?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          last_seen_count?: number
          name?: string
          notify?: boolean
          user_id?: string
        }
        Relationships: []
      }
      skill_assessments: {
        Row: {
          correct: number
          created_at: string
          details: Json
          id: string
          level: string | null
          score: number
          skill: string
          total: number
          user_id: string
        }
        Insert: {
          correct?: number
          created_at?: string
          details?: Json
          id?: string
          level?: string | null
          score?: number
          skill: string
          total?: number
          user_id: string
        }
        Update: {
          correct?: number
          created_at?: string
          details?: Json
          id?: string
          level?: string | null
          score?: number
          skill?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      skill_questions: {
        Row: {
          answer_index: number
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          is_active: boolean
          options: Json
          question: string
          skill: string
        }
        Insert: {
          answer_index: number
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          options: Json
          question: string
          skill: string
        }
        Update: {
          answer_index?: number
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          options?: Json
          question?: string
          skill?: string
        }
        Relationships: []
      }
      skill_gaps: {
        Row: {
          created_at: string
          current_skills: Json
          id: string
          missing_skills: Json
          required_skills: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_skills?: Json
          id?: string
          missing_skills?: Json
          required_skills?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_skills?: Json
          id?: string
          missing_skills?: Json
          required_skills?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          career_goals: string | null
          company_type: string | null
          created_at: string
          id: string
          min_salary: number | null
          preferred_locations: Json
          preferred_roles: Json
          preferred_technologies: Json
          updated_at: string
          user_id: string
          work_model: string | null
        }
        Insert: {
          career_goals?: string | null
          company_type?: string | null
          created_at?: string
          id?: string
          min_salary?: number | null
          preferred_locations?: Json
          preferred_roles?: Json
          preferred_technologies?: Json
          updated_at?: string
          user_id: string
          work_model?: string | null
        }
        Update: {
          career_goals?: string | null
          company_type?: string | null
          created_at?: string
          id?: string
          min_salary?: number | null
          preferred_locations?: Json
          preferred_roles?: Json
          preferred_technologies?: Json
          updated_at?: string
          user_id?: string
          work_model?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_internships: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          internship_id: string
          similarity: number
        }[]
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
