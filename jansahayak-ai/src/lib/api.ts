// API base configuration
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// ─── Auth helpers ───────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('jansahayak_token');
const setToken = (token: string) => localStorage.setItem('jansahayak_token', token);
const clearToken = () => localStorage.removeItem('jansahayak_token');

async function request<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const token = getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
}

async function requestMultipart<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
}

// ─── Auth API ───────────────────────────────────────────────────────────
export const authApi = {
    register: (data: { full_name: string; phone: string; password: string; preferred_language?: string; state?: string }) =>
        request<{ access_token: string; user_id: number; full_name: string; role: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    login: (phone: string, password: string) =>
        request<{ access_token: string; user_id: number; full_name: string; role: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone, password }),
        }),

    getMe: () => request<Record<string, unknown>>('/auth/me'),

    updateProfile: (updates: Record<string, unknown>) =>
        request('/auth/profile', { method: 'PUT', body: JSON.stringify(updates) }),

    saveToken: setToken,
    clearToken,
    getToken,
};

// ─── Schemes API ────────────────────────────────────────────────────────
export const schemesApi = {
    getSchemes: (params?: { category?: string; state?: string; search?: string; max_income?: number }) => {
        const qs = new URLSearchParams(params as Record<string, string>).toString();
        return request<{ total: number; schemes: SchemeResponse[] }>(`/schemes/?${qs}`);
    },

    getScheme: (id: number) => request<SchemeResponse>(`/schemes/${id}`),

    aiMatch: () => request<{ schemes: SchemeResponse[]; ai_matches: AiMatch[]; ai_matched: boolean }>('/schemes/match/ai'),

    getMyMatches: () => request<SchemeResponse[]>('/schemes/user/matches'),
};

// ─── Chat API ───────────────────────────────────────────────────────────
export const chatApi = {
    sendMessage: (message: string, sessionId?: string, language = 'en') =>
        request<{ session_id: string; response: string; audio_url?: string | null; language: string }>('/chat/message', {
            method: 'POST',
            body: JSON.stringify({ message, session_id: sessionId, language }),
        }),

    getHistory: (sessionId: string) =>
        request<ChatMessage[]>(`/chat/history/${sessionId}`),
};

// ─── Documents API ──────────────────────────────────────────────────────
export const documentsApi = {
    upload: (file: File, documentType: string, language = 'en') => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('document_type', documentType);
        fd.append('language', language);
        return requestMultipart<{ document_id: number; file_name: string; analysis: DocumentAnalysis }>('/documents/upload', fd);
    },

    getMyDocuments: () => request<UserDocument[]>('/documents/'),

    deleteDocument: (id: number) => request(`/documents/${id}`, { method: 'DELETE' }),
};

// ─── Grievances API ─────────────────────────────────────────────────────
export const grievancesApi = {
    create: (data: { category: string; description: string; aadhaar_last4?: string }) =>
        request<{ ticket_id: string; grievance_id: number; status: string; message: string }>('/grievances/', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getMyGrievances: () => request<GrievanceResponse[]>('/grievances/'),

    track: (ticketId: string) => request<GrievanceResponse>(`/grievances/track/${ticketId}`),
};

// ─── Locations API ──────────────────────────────────────────────────────
export const locationsApi = {
    getLocations: (params?: { state?: string; district?: string; office_type?: string; lat?: number; lng?: number; search?: string }) => {
        const qs = new URLSearchParams(params as unknown as Record<string, string>).toString();
        return request<LocationResponse[]>(`/offices/all?${qs}`);
    },
    getNearby: (lat: number, lng: number, radius = 50) =>
        request<LocationResponse[]>(`/offices/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
};

// ─── Admin API ──────────────────────────────────────────────────────────
export const adminApi = {
    getStats: () => request<AdminStats>('/admin/stats'),
    getUsers: (page = 1) => request<{ total: number; users: unknown[] }>(`/admin/users?page=${page}`),
    getGrievances: (status?: string, page = 1) =>
        request<{ total: number; items: unknown[] }>(`/admin/grievances?page=${page}${status ? `&status=${status}` : ''}`),
};

// ─── Types ──────────────────────────────────────────────────────────────
export interface SchemeResponse {
    id: number;
    name: string;
    category: string;
    ministry?: string;
    description?: string;
    description_simple?: string;
    benefit_amount?: string;
    benefit_type?: string;
    eligibility_criteria?: string;
    required_documents?: string;
    applying_authority?: string;
    scheme_type?: string;
    state_specific?: string;
    deadline?: string;
    launch_year?: number;
    beneficiary_type?: string;
    min_age?: number;
    max_age?: number;
    income_limit?: number;
    gender?: string;
    caste?: string;
    tags?: string;
    match_percentage?: number;
    match_reasons?: string[];
    // Translations — description
    description_hi?: string; description_gu?: string; description_bn?: string;
    description_ta?: string; description_te?: string; description_mr?: string;
    description_pa?: string; description_kn?: string; description_ml?: string;
    // Translations — eligibility_criteria
    eligibility_criteria_hi?: string; eligibility_criteria_gu?: string; eligibility_criteria_bn?: string;
    eligibility_criteria_ta?: string; eligibility_criteria_te?: string; eligibility_criteria_mr?: string;
    eligibility_criteria_pa?: string; eligibility_criteria_kn?: string; eligibility_criteria_ml?: string;
    // Translations — required_documents
    required_documents_hi?: string; required_documents_gu?: string; required_documents_bn?: string;
    required_documents_ta?: string; required_documents_te?: string; required_documents_mr?: string;
    required_documents_pa?: string; required_documents_kn?: string; required_documents_ml?: string;
}

export interface AiMatch {
    scheme_name: string;
    match_percentage: number;
    key_reason: string;
    action_required: string;
}

export interface ChatMessage {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
}

export interface DocumentAnalysis {
    document_type: string;
    holder_name: string;
    key_fields: Record<string, string>;
    validity: string;
    important_dates: Record<string, string>;
    summary_simple: string;
    eligible_schemes: string[];
    warnings: string[];
}

export interface UserDocument {
    id: number;
    document_type: string;
    file_name: string;
    file_size_kb?: number;
    ai_summary?: string;
    ocr_data?: Record<string, unknown>;
    is_verified: boolean;
    storage_type?: 's3' | 'local';
    access_url?: string;
    created_at?: string;
}

export interface GrievanceResponse {
    id: number;
    ticket_id: string;
    category: string;
    description: string;
    status: string;
    resolution_notes?: string;
    created_at?: string;
}

export interface LocationResponse {
    id: number;
    name: string;
    office_type: string;
    address: string;
    district?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    operating_hours?: string;
    services?: string[];
    distance_km?: number;
}

export interface AdminStats {
    kpis: {
        total_citizens: number;
        active_conversations: number;
        schemes_matched: number;
        total_grievances: number;
        resolved_grievances: number;
        benefits_unlocked_estimate: number;
    };
    voice_text_ratio: { voice: number; text: number };
    language_distribution: { name: string; users: number }[];
    recent_grievances: { ticket_id: string; category: string; status: string; created_at: string }[];
}
