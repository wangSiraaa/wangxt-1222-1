import request from '@/utils/request'
import type {
  WaterLevelRecord,
  GateSchedule,
  GateActualOpening,
  EcologicalFlowConfirmation,
  WaterSupplyImpact,
  ApprovalRecord,
  WarningRecord,
  ScheduleCurveData,
  ApiResponse,
} from '@/types'

export const waterLevelApi = {
  create: (data: Partial<WaterLevelRecord>) =>
    request.post<ApiResponse<WaterLevelRecord>>('/water-level', data).then((r) => r.data),
  list: (params?: Record<string, unknown>) =>
    request.get<ApiResponse<WaterLevelRecord[]>>('/water-level', { params }).then((r) => r.data),
  getLatest: () =>
    request.get<ApiResponse<WaterLevelRecord>>('/water-level/latest').then((r) => r.data),
  get: (id: string) =>
    request.get<ApiResponse<WaterLevelRecord>>(`/water-level/${id}`).then((r) => r.data),
  update: (id: string, data: Partial<WaterLevelRecord>) =>
    request.put<ApiResponse<WaterLevelRecord>>(`/water-level/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    request.delete<ApiResponse<null>>(`/water-level/${id}`).then((r) => r.data),
}

export const gateScheduleApi = {
  create: (data: Partial<GateSchedule>) =>
    request.post<ApiResponse<GateSchedule>>('/gate-schedule', data).then((r) => r.data),
  list: (params?: Record<string, unknown>) =>
    request.get<ApiResponse<GateSchedule[]>>('/gate-schedule', { params }).then((r) => r.data),
  getCurve: (params?: Record<string, unknown>) =>
    request.get<ApiResponse<ScheduleCurveData[]>>('/gate-schedule/curve', { params }).then((r) => r.data),
  get: (id: string) =>
    request.get<ApiResponse<GateSchedule>>(`/gate-schedule/${id}`).then((r) => r.data),
  update: (id: string, data: Partial<GateSchedule>) =>
    request.put<ApiResponse<GateSchedule>>(`/gate-schedule/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    request.delete<ApiResponse<null>>(`/gate-schedule/${id}`).then((r) => r.data),
  submit: (id: string) =>
    request.post<ApiResponse<GateSchedule>>(`/gate-schedule/${id}/submit`).then((r) => r.data),
}

export const gateActualApi = {
  create: (data: Partial<GateActualOpening>) =>
    request.post<ApiResponse<GateActualOpening>>('/gate-actual', data).then((r) => r.data),
  list: (params?: Record<string, unknown>) =>
    request.get<ApiResponse<GateActualOpening[]>>('/gate-actual', { params }).then((r) => r.data),
  get: (id: string) =>
    request.get<ApiResponse<GateActualOpening>>(`/gate-actual/${id}`).then((r) => r.data),
  update: (id: string, data: Partial<GateActualOpening>) =>
    request.put<ApiResponse<GateActualOpening>>(`/gate-actual/${id}`, data).then((r) => r.data),
}

export const ecologicalFlowApi = {
  create: (data: Partial<EcologicalFlowConfirmation>) =>
    request.post<ApiResponse<EcologicalFlowConfirmation>>('/ecological-flow', data).then((r) => r.data),
  list: (params?: Record<string, unknown>) =>
    request.get<ApiResponse<EcologicalFlowConfirmation[]>>('/ecological-flow', { params }).then((r) => r.data),
  get: (id: string) =>
    request.get<ApiResponse<EcologicalFlowConfirmation>>(`/ecological-flow/${id}`).then((r) => r.data),
  confirm: (id: string, data: Record<string, unknown>) =>
    request.post<ApiResponse<EcologicalFlowConfirmation>>(`/ecological-flow/${id}/confirm`, data).then((r) => r.data),
}

export const waterSupplyApi = {
  create: (data: Partial<WaterSupplyImpact>) =>
    request.post<ApiResponse<WaterSupplyImpact>>('/water-supply', data).then((r) => r.data),
  list: (params?: Record<string, unknown>) =>
    request.get<ApiResponse<WaterSupplyImpact[]>>('/water-supply', { params }).then((r) => r.data),
  get: (id: string) =>
    request.get<ApiResponse<WaterSupplyImpact>>(`/water-supply/${id}`).then((r) => r.data),
  markViewed: (id: string, data: Record<string, unknown>) =>
    request.post<ApiResponse<WaterSupplyImpact>>(`/water-supply/${id}/viewed`, data).then((r) => r.data),
  generateImpact: (scheduleId: string, data: Record<string, unknown>) =>
    request.post<ApiResponse<WaterSupplyImpact>>(`/water-supply/generate/${scheduleId}`, data).then((r) => r.data),
}

export const approvalApi = {
  list: (params?: Record<string, unknown>) =>
    request.get<ApiResponse<ApprovalRecord[]>>('/approval', { params }).then((r) => r.data),
  approve: (businessType: string, businessId: string, data: Record<string, unknown>) =>
    request.post<ApiResponse<ApprovalRecord>>(`/approval/${businessType}/${businessId}/approve`, data).then((r) => r.data),
  reject: (businessType: string, businessId: string, data: Record<string, unknown>) =>
    request.post<ApiResponse<ApprovalRecord>>(`/approval/${businessType}/${businessId}/reject`, data).then((r) => r.data),
}

export const warningApi = {
  list: (params?: Record<string, unknown>) =>
    request.get<ApiResponse<WarningRecord[]>>('/warning', { params }).then((r) => r.data),
  stats: () =>
    request.get<ApiResponse<Record<string, number>>>('/warning/stats').then((r) => r.data),
  get: (id: string) =>
    request.get<ApiResponse<WarningRecord>>(`/warning/${id}`).then((r) => r.data),
  handle: (id: string, data: Record<string, unknown>) =>
    request.post<ApiResponse<WarningRecord>>(`/warning/${id}/handle`, data).then((r) => r.data),
}
