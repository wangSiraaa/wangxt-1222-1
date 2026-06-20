import React, { useState, useEffect } from 'react'
import { gateScheduleApi, waterLevelApi, approvalApi } from '@/services/api'
import type { GateSchedule, WaterLevelRecord } from '@/types'
import { formatDateTime, formatNumber, getStatusColor, getStatusText } from '@/utils'
import Modal from '@/components/Modal'
import ScheduleCurveChart from '@/components/ScheduleCurveChart'
import '@/styles/table.css'
import '@/styles/form.css'

const GateSchedulePage: React.FC = () => {
  const [list, setList] = useState<GateSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState<GateSchedule | null>(null)
  const [approvalModal, setApprovalModal] = useState(false)
  const [currentSchedule, setCurrentSchedule] = useState<GateSchedule | null>(null)
  const [latestWaterLevel, setLatestWaterLevel] = useState<WaterLevelRecord | null>(null)
  const [approvalForm, setApprovalForm] = useState({ approver_name: '', approval_opinion: '' })
  const [filters, setFilters] = useState({ status: '', gate_no: '' })
  const [form, setForm] = useState({
    gate_no: '1号闸门',
    planned_opening: '',
    planned_discharge: '',
    operator_name: '',
    remark: '',
  })

  useEffect(() => {
    fetchList()
    fetchLatestWaterLevel()
  }, [filters])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await gateScheduleApi.list(filters)
      if (res.data) setList(res.data)
    } catch (error) {
      console.error('Failed to fetch schedule list:', error)
      generateMockData()
    } finally {
      setLoading(false)
    }
  }

  const fetchLatestWaterLevel = async () => {
    try {
      const res = await waterLevelApi.getLatest()
      if (res.data) setLatestWaterLevel(res.data)
    } catch (error) {
      setLatestWaterLevel({
        id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        record_time: new Date().toISOString(),
        upstream_inflow: 45,
        downstream_water_level: 33,
      })
    }
  }

  const generateMockData = () => {
    const statuses: GateSchedule['status'][] = ['draft', 'pending_approval', 'approved', 'rejected', 'executed']
    const mockList: GateSchedule[] = []
    for (let i = 0; i < 8; i++) {
      mockList.push({
        id: String(i + 1),
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        updated_at: new Date(Date.now() - i * 86400000).toISOString(),
        schedule_date: new Date(Date.now() - i * 86400000).toISOString(),
        gate_no: `${(i % 3) + 1}号闸门`,
        planned_opening: 30 + Math.random() * 40,
        planned_discharge: 20 + Math.random() * 50,
        status: statuses[i % statuses.length],
        operator_name: ['调度员A', '调度员B', '调度员C'][i % 3],
      })
    }
    setList(mockList)
  }

  const handleSubmit = async () => {
    if (!form.planned_opening || !form.planned_discharge) {
      alert('请填写完整信息')
      return
    }
    if (latestWaterLevel && latestWaterLevel.downstream_water_level >= 35) {
      const discharge = parseFloat(form.planned_discharge)
      if (discharge > latestWaterLevel.upstream_inflow) {
        alert('下游水位已超警戒水位（35.00m），禁止执行加大下泄调度！')
        return
      }
    }
    try {
      const data = {
        ...form,
        planned_opening: parseFloat(form.planned_opening),
        planned_discharge: parseFloat(form.planned_discharge),
      }
      if (editing) {
        await gateScheduleApi.update(editing.id, data)
      } else {
        await gateScheduleApi.create(data)
      }
      setModalVisible(false)
      resetForm()
      fetchList()
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const handleSubmitApproval = async (schedule: GateSchedule) => {
    try {
      await gateScheduleApi.submit(schedule.id)
      fetchList()
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const handleApprove = async (approved: boolean) => {
    if (!currentSchedule) return
    try {
      if (approved) {
        await approvalApi.approve('gate_schedule', currentSchedule.id, approvalForm)
      } else {
        await approvalApi.reject('gate_schedule', currentSchedule.id, approvalForm)
      }
      setApprovalModal(false)
      setApprovalForm({ approver_name: '', approval_opinion: '' })
      fetchList()
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此调度计划？')) return
    try {
      await gateScheduleApi.remove(id)
      fetchList()
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const handleEdit = (record: GateSchedule) => {
    setEditing(record)
    setForm({
      gate_no: record.gate_no,
      planned_opening: String(record.planned_opening),
      planned_discharge: String(record.planned_discharge),
      operator_name: record.operator_name || '',
      remark: record.remark || '',
    })
    setModalVisible(true)
  }

  const resetForm = () => {
    setEditing(null)
    setForm({
      gate_no: '1号闸门',
      planned_opening: '',
      planned_discharge: '',
      operator_name: '',
      remark: '',
    })
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">闸门调度</div>
        <div className="page-desc">调度员制定闸门计划，提交审批后执行</div>
      </div>

      {latestWaterLevel && latestWaterLevel.downstream_water_level >= 35 && (
        <div className="alert alert-error">
          ⚠️ 当前下游水位 {formatNumber(latestWaterLevel.downstream_water_level)}m 已超过警戒水位（35.00m），禁止加大下泄流量！
        </div>
      )}

      <ScheduleCurveChart height={280} />

      <div className="filter-bar">
        <div className="filter-item">
          <label>闸门:</label>
          <select value={filters.gate_no} onChange={(e) => setFilters({ ...filters, gate_no: e.target.value })}>
            <option value="">全部</option>
            <option value="1号闸门">1号闸门</option>
            <option value="2号闸门">2号闸门</option>
            <option value="3号闸门">3号闸门</option>
          </select>
        </div>
        <div className="filter-item">
          <label>状态:</label>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">全部</option>
            <option value="draft">草稿</option>
            <option value="pending_approval">待审批</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
            <option value="executed">已执行</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setModalVisible(true)}>
          + 新增调度计划
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>调度日期</th>
            <th>闸门</th>
            <th>计划开度 (%)</th>
            <th>计划下泄 (m³/s)</th>
            <th>状态</th>
            <th>录入人</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="empty-state">加载中...</td></tr>
          ) : list.length === 0 ? (
            <tr><td colSpan={8} className="empty-state">暂无数据</td></tr>
          ) : (
            list.map((item) => (
              <tr key={item.id}>
                <td>{formatDateTime(item.schedule_date, 'YYYY-MM-DD')}</td>
                <td>{item.gate_no}</td>
                <td>{formatNumber(item.planned_opening)}</td>
                <td>{formatNumber(item.planned_discharge)}</td>
                <td>
                  <span className="badge" style={{
                    background: getStatusColor(item.status) + '20',
                    color: getStatusColor(item.status),
                    border: `1px solid ${getStatusColor(item.status)}40`,
                  }}>
                    {getStatusText(item.status)}
                  </span>
                </td>
                <td>{item.operator_name || '-'}</td>
                <td>{formatDateTime(item.created_at)}</td>
                <td>
                  {item.status === 'draft' && (
                    <>
                      <button className="btn btn-sm" onClick={() => handleEdit(item)}>编辑</button>
                      <button className="btn btn-sm btn-warning" onClick={() => handleSubmitApproval(item)}>提交审批</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>删除</button>
                    </>
                  )}
                  {item.status === 'pending_approval' && (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => { setCurrentSchedule(item); setApprovalModal(true) }}>审批</button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Modal
        visible={modalVisible}
        title={editing ? '编辑调度计划' : '新增调度计划'}
        onClose={() => { setModalVisible(false); resetForm() }}
        onConfirm={handleSubmit}
        width={500}
      >
        {latestWaterLevel && latestWaterLevel.downstream_water_level >= 35 && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            ⚠️ 当前下游水位 {formatNumber(latestWaterLevel.downstream_water_level)}m 已超警戒，计划下泄流量不能超过上游来水 ({formatNumber(latestWaterLevel.upstream_inflow)} m³/s)
          </div>
        )}
        <div className="form-row">
          <label className="form-label required">闸门</label>
          <select
            className="form-select"
            value={form.gate_no}
            onChange={(e) => setForm({ ...form, gate_no: e.target.value })}
          >
            <option value="1号闸门">1号闸门</option>
            <option value="2号闸门">2号闸门</option>
            <option value="3号闸门">3号闸门</option>
          </select>
        </div>
        <div className="form-row">
          <label className="form-label required">计划开度 (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            className="form-input"
            value={form.planned_opening}
            onChange={(e) => setForm({ ...form, planned_opening: e.target.value })}
            placeholder="请输入计划开度 (0-100)"
          />
        </div>
        <div className="form-row">
          <label className="form-label required">计划下泄流量 (m³/s)</label>
          <input
            type="number"
            step="0.01"
            className="form-input"
            value={form.planned_discharge}
            onChange={(e) => setForm({ ...form, planned_discharge: e.target.value })}
            placeholder="请输入计划下泄流量"
          />
        </div>
        <div className="form-row">
          <label className="form-label">调度员</label>
          <input
            type="text"
            className="form-input"
            value={form.operator_name}
            onChange={(e) => setForm({ ...form, operator_name: e.target.value })}
            placeholder="请输入调度员姓名"
          />
        </div>
        <div className="form-row">
          <label className="form-label">备注</label>
          <textarea
            className="form-textarea"
            value={form.remark}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
            placeholder="请输入备注"
          />
        </div>
      </Modal>

      <Modal
        visible={approvalModal}
        title="调度计划审批"
        onClose={() => setApprovalModal(false)}
        width={500}
      >
        {currentSchedule && (
          <>
            <div className="info-grid" style={{ marginBottom: 16 }}>
              <div className="info-item">
                <span className="info-item-label">闸门</span>
                <span className="info-item-value">{currentSchedule.gate_no}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">计划开度</span>
                <span className="info-item-value">{formatNumber(currentSchedule.planned_opening)}%</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">计划下泄</span>
                <span className="info-item-value">{formatNumber(currentSchedule.planned_discharge)} m³/s</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">录入人</span>
                <span className="info-item-value">{currentSchedule.operator_name || '-'}</span>
              </div>
            </div>
            <div className="form-row">
              <label className="form-label required">审批人</label>
              <input
                type="text"
                className="form-input"
                value={approvalForm.approver_name}
                onChange={(e) => setApprovalForm({ ...approvalForm, approver_name: e.target.value })}
                placeholder="请输入审批人姓名"
              />
            </div>
            <div className="form-row">
              <label className="form-label">审批意见</label>
              <textarea
                className="form-textarea"
                value={approvalForm.approval_opinion}
                onChange={(e) => setApprovalForm({ ...approvalForm, approval_opinion: e.target.value })}
                placeholder="请输入审批意见"
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-danger" onClick={() => handleApprove(false)}>驳回</button>
              <button className="btn btn-success" onClick={() => handleApprove(true)}>通过</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

export default GateSchedulePage
