import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { gateScheduleApi } from '@/services/api'
import type { ScheduleDetail } from '@/types'
import { formatDateTime, formatNumber, getStatusColor, getStatusText } from '@/utils'
import ScheduleCurveChart from '@/components/ScheduleCurveChart'
import '@/styles/table.css'
import '@/styles/form.css'

const ScheduleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<ScheduleDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'actual' | 'water' | 'eco' | 'approval'>('basic')

  useEffect(() => {
    if (id) fetchDetail()
  }, [id])

  const fetchDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await gateScheduleApi.getDetail(id)
      if (res.data) setDetail(res.data)
    } catch (error) {
      console.error('Failed to fetch schedule detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const impactLevelColor = (level?: string) => {
    switch (level) {
      case 'high': return '#ff4d4f'
      case 'medium': return '#faad14'
      case 'low': return '#52c41a'
      default: return '#8c8c8c'
    }
  }

  const impactLevelText = (level?: string) => {
    switch (level) {
      case 'high': return '高影响'
      case 'medium': return '中影响'
      case 'low': return '低影响'
      default: return '-'
    }
  }

  const tabs = [
    { key: 'basic', label: '调度信息' },
    { key: 'actual', label: '执行记录' },
    { key: 'water', label: '供水影响' },
    { key: 'eco', label: '生态流量' },
    { key: 'approval', label: '审批记录' },
  ]

  if (loading) {
    return <div className="page-container"><div className="empty-state">加载中...</div></div>
  }

  if (!detail) {
    return <div className="page-container"><div className="empty-state">未找到调度详情</div></div>
  }

  const { schedule, actual_openings, water_supply_impact, ecological_flow, approvals } = detail

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <button
            className="btn btn-sm"
            style={{ marginBottom: 8 }}
            onClick={() => navigate(-1)}
          >
            ← 返回
          </button>
          <div className="page-title">调度详情</div>
          <div className="page-desc">{schedule.gate_no} - {formatDateTime(schedule.schedule_date, 'YYYY-MM-DD')}</div>
        </div>
        <span className="badge" style={{
          background: getStatusColor(schedule.status) + '20',
          color: getStatusColor(schedule.status),
          border: `1px solid ${getStatusColor(schedule.status)}40`,
          padding: '4px 12px',
          fontSize: 14,
        }}>
          {getStatusText(schedule.status)}
        </span>
      </div>

      <ScheduleCurveChart height={260} />

      <div className="tab-bar">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
          >
            {tab.label}
            {tab.key === 'actual' && actual_openings.some(a => a.is_deviation_exceeded) && (
              <span className="tab-badge">!</span>
            )}
          </div>
        ))}
      </div>

      {activeTab === 'basic' && (
        <div className="detail-card">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-item-label">闸门</span>
              <span className="info-item-value">{schedule.gate_no}</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">计划开度</span>
              <span className="info-item-value">{formatNumber(schedule.planned_opening)}%</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">计划下泄</span>
              <span className="info-item-value">{formatNumber(schedule.planned_discharge)} m³/s</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">调度日期</span>
              <span className="info-item-value">{formatDateTime(schedule.schedule_date, 'YYYY-MM-DD')}</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">录入人</span>
              <span className="info-item-value">{schedule.operator_name || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">创建时间</span>
              <span className="info-item-value">{formatDateTime(schedule.created_at)}</span>
            </div>
          </div>
          {schedule.remark && (
            <div className="detail-section">
              <div className="detail-section-title">备注</div>
              <div className="detail-section-content">{schedule.remark}</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'actual' && (
        <div className="detail-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>记录时间</th>
                <th>实际开度 (%)</th>
                <th>实际下泄 (m³/s)</th>
                <th>偏差 (%)</th>
                <th>是否超阈值</th>
                <th>偏差原因</th>
                <th>操作人</th>
              </tr>
            </thead>
            <tbody>
              {actual_openings.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">暂无执行记录</td></tr>
              ) : (
                actual_openings.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDateTime(item.record_time)}</td>
                    <td>{formatNumber(item.actual_opening)}</td>
                    <td>{formatNumber(item.actual_discharge)}</td>
                    <td style={{ color: item.is_deviation_exceeded ? '#ff4d4f' : 'inherit', fontWeight: item.is_deviation_exceeded ? 600 : 400 }}>
                      {formatNumber(item.deviation)}
                    </td>
                    <td>
                      {item.is_deviation_exceeded ? (
                        <span className="badge badge-error">是</span>
                      ) : (
                        <span className="badge badge-success">否</span>
                      )}
                    </td>
                    <td>
                      {item.deviation_reason ? (
                        <span style={{ color: '#595959' }}>{item.deviation_reason}</span>
                      ) : (
                        <span style={{ color: '#bfbfbf' }}>-</span>
                      )}
                    </td>
                    <td>{item.operator_name || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'water' && (
        <div className="detail-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>供水单位</th>
                <th>预估取水量 (m³/s)</th>
                <th>影响等级</th>
                <th>影响说明</th>
                <th>查看状态</th>
                <th>查看人</th>
              </tr>
            </thead>
            <tbody>
              {water_supply_impact.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">暂无供水影响记录</td></tr>
              ) : (
                water_supply_impact.map((item) => (
                  <tr key={item.id}>
                    <td>{item.water_supply_unit}</td>
                    <td>{formatNumber(item.estimated_intake)}</td>
                    <td>
                      <span className="badge" style={{
                        background: impactLevelColor(item.impact_level) + '20',
                        color: impactLevelColor(item.impact_level),
                        border: `1px solid ${impactLevelColor(item.impact_level)}40`,
                      }}>
                        {impactLevelText(item.impact_level)}
                      </span>
                    </td>
                    <td>{item.impact_desc || '-'}</td>
                    <td>
                      {item.viewed_at ? (
                        <span className="badge badge-success">已查看</span>
                      ) : (
                        <span className="badge badge-warning">未查看</span>
                      )}
                    </td>
                    <td>{item.viewer_name || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'eco' && (
        <div className="detail-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>最小要求 (m³/s)</th>
                <th>确认流量 (m³/s)</th>
                <th>是否满足</th>
                <th>补偿说明</th>
                <th>确认人</th>
                <th>确认时间</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {ecological_flow.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">暂无生态流量确认</td></tr>
              ) : (
                ecological_flow.map((item) => (
                  <tr key={item.id}>
                    <td>{formatNumber(item.min_required_flow)}</td>
                    <td style={{ color: !item.is_sufficient ? '#ff4d4f' : 'inherit' }}>
                      {formatNumber(item.confirmed_flow)}
                    </td>
                    <td>
                      {item.is_sufficient ? (
                        <span className="badge badge-success">满足</span>
                      ) : (
                        <span className="badge badge-warning">不足</span>
                      )}
                    </td>
                    <td>{item.compensation_note || '-'}</td>
                    <td>{item.confirmer_name || '-'}</td>
                    <td>{item.confirmed_at ? formatDateTime(item.confirmed_at) : '-'}</td>
                    <td>
                      <span className="badge" style={{
                        background: getStatusColor(item.status) + '20',
                        color: getStatusColor(item.status),
                        border: `1px solid ${getStatusColor(item.status)}40`,
                      }}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'approval' && (
        <div className="detail-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>审批类型</th>
                <th>审批结果</th>
                <th>审批意见</th>
                <th>审批人</th>
                <th>审批时间</th>
              </tr>
            </thead>
            <tbody>
              {approvals.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">暂无审批记录</td></tr>
              ) : (
                approvals.map((item) => (
                  <tr key={item.id}>
                    <td>{item.approval_type}</td>
                    <td>
                      <span className="badge" style={{
                        background: item.approval_result === 'approved' || item.approval_result === 'submitted' ? '#52c41a20' : '#ff4d4f20',
                        color: item.approval_result === 'approved' || item.approval_result === 'submitted' ? '#52c41a' : '#ff4d4f',
                        border: `1px solid ${item.approval_result === 'approved' || item.approval_result === 'submitted' ? '#52c41a' : '#ff4d4f'}40`,
                      }}>
                        {item.approval_result}
                      </span>
                    </td>
                    <td>{item.approval_opinion || '-'}</td>
                    <td>{item.approver_name || '-'}</td>
                    <td>{item.approved_at ? formatDateTime(item.approved_at) : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ScheduleDetailPage
