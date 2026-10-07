import axios, { AxiosInstance } from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL,
  timeout: 30000,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - unwraps response.data so callers get the JSON body directly
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (axios.isAxiosError(error)) {
      return Promise.reject({
        message: error.response?.data?.error || error.message,
        status: error.response?.status,
      });
    }
    return Promise.reject(error);
  }
);

// Re-type the instance so TS reflects the unwrapped response shape from the interceptor above
interface DataClient {
  get<T = any>(url: string, config?: any): Promise<T>;
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
  put<T = any>(url: string, data?: any, config?: any): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: any): Promise<T>;
  delete<T = any>(url: string, config?: any): Promise<T>;
}

export const apiClient = axiosInstance as unknown as DataClient;

// Vendor APIs
export const vendorApi = {
  list: (status?: string) => apiClient.get('/vendors', { params: { status } }),
  create: (data: any) => apiClient.post('/vendors', data),
  get: (id: string) => apiClient.get(`/vendors/${id}`),
  update: (id: string, data: any) => apiClient.put(`/vendors/${id}`, data),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/vendors/${id}/status`, { status }),
  verify: (id: string) => apiClient.post(`/vendors/${id}/verify`),
  getHistory: (id: string) => apiClient.get(`/vendors/${id}/history`),
  restoreVersion: (id: string, auditLogId: string) =>
    apiClient.post(`/vendors/${id}/restore/${auditLogId}`),
};

// Document APIs
export const documentApi = {
  list: (vendorId: string) => apiClient.get(`/vendors/${vendorId}/documents`),
  upload: (vendorId: string, documentType: string, file: File) => {
    const formData = new FormData();
    formData.append('vendorId', vendorId);
    formData.append('documentType', documentType);
    formData.append('file', file);
    return apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateExtracted: (documentId: string, data: any) =>
    apiClient.patch(`/documents/${documentId}/extracted`, data),
  getChecklist: (vendorId: string) =>
    apiClient.get(`/vendors/${vendorId}/checklist`),
  checkMissing: (vendorId: string) =>
    apiClient.post(`/vendors/${vendorId}/check-missing`),
  getMismatches: (vendorId: string) =>
    apiClient.get(`/vendors/${vendorId}/mismatches`),
  resolveMismatch: (mismatchId: string, resolution?: string) =>
    apiClient.patch(`/mismatches/${mismatchId}/resolve`, { resolution }),
};

// Task APIs
export const taskApi = {
  list: (vendorId: string) => apiClient.get(`/vendors/${vendorId}/tasks`),
  create: (data: any) => apiClient.post('/tasks', data),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/tasks/${id}/status`, { status }),
  delete: (id: string) => apiClient.delete(`/tasks/${id}`),
  getPending: () => apiClient.get('/tasks/pending'),
};
