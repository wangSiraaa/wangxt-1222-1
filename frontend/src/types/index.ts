export interface BaseModel {
  id: string
  created_at: string
  updated_at: string
}

export interface WaterLevelRecord extends BaseModel {
  record_time: string
  upstream_inflow: number
  downstream_water_level: number
  reservoir_level?: number
  operator_id?: string
  operator_name?: string
  remark?: string
}

export interface GateSchedule extends BaseModel {
  schedule_date: string
  gate_no: string
  planned_opening: number
  planned_discharge: number
  start_time?: string
  end_time?: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'executed'
  operator_id?: string
  operator_name?: string
  remark?: string
}

export interface GateActualOpening extends BaseModel {
  schedule_id?: string
  gate_no: string
  actual_opening: number
  actual_discharge: number
  record_time: string
  deviation: number
  is_deviation_exceeded: boolean
  deviation_reason?: string
  operator_id?: string
  operator_name?: string
}

export interface EcologicalFlowConfirmation extends BaseModel {
  schedule_id: string
  min_required_flow: number
  confirmed_flow: number
  is_sufficient: boolean
  compensation_note?: string
  confirmed_at?: string
  confirmer_id?: string
  confirmer_name?: string
  status: 'pending' | 'confirmed' | 'rejected'
}

export interface WaterSupplyImpact extends BaseModel {
  schedule_id: string
  water_supply_unit: string
  estimated_intake?: number
  impact_level?: 'low' | 'medium' | 'high'
  impact_desc?: string
  viewed_at?: string
  viewer_id?: string
  viewer_name?: string
}

export interface ApprovalRecord extends BaseModel {
  business_id: string
  business_type: string
  approval_type: string
  approver_id?: string
  approver_name?: string
  approval_result: string
  approval_opinion?: string
  approved_at?: string
}

export interface WarningRecord extends BaseModel {
  warning_type: string
  warning_level: 'low' | 'medium' | 'high'
  warning_msg: string
  business_id?: string
  business_type?: string
  is_handled: boolean
  handled_at?: string
  handler_id?: string
  handler_name?: string
  handle_remark?: string
}

export interface ScheduleCurveData {
  time: string
  planned_discharge: number
  actual_discharge: number
  water_level: number
  inflow: number
}

export interface ApiResponse<T> {
  code: number
  message: string
  data?: T
}
