import React, { useState, useEffect } from 'react'
import { gateActualApi, gateScheduleApi } from '@/services/api'
import type { GateActualOpening, GateSchedule } from '@/types'
import { formatDateTime, formatNumber, getWarningLevelColor } from '@/utils'
import Modal from '@/components/Modal'
import '@/styles/table.css'
import '@/styles/form.css'

const GateActualPage: React.FC = () => {
  const [list, setList] = useState<GateActualOpening[]>([])
  const [schedules, setSchedules] = useState<GateSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [filters, setFilters] = useState({ gate_no: '', only_deviation: '' })
  const [form, setForm] = useState({
    schedule_id: '',
    gate_no: '1号闸门',
    actual_opening: '',
    actual_discharge: '',
    deviation_reason: '',
    operator_name: '',
  })

  useEffect(() => {
    fetchList()
    fetchSchedules()
  }, [filters])

  const fetchList = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filters.gate_no) params.gate_no = filters.gate_no
      if (filters.only_deviation) params.only_deviation = filters.only_deviation
      const res = await gateActualApi.list(params)
      if (res.data) setList(res.data)
    } catch (error) {
      console.error('Failed to fetch actual opening list:', error)
      generateMockData()
    } finally {
      setLoading(false)
    }
  }

  const fetchSchedules = async () => {
    try {
      const res = await gateScheduleApi.list({ status: 'approved' })
      if (res.data) setSchedules(res.data)
    } catch (error) {
      setSchedules([])
    }
  }

  const generateMockData = () => {
    const mockList: GateActualOpening[] = []
    for (let i = 0; i < 12; i++) {
      const planned = 40 + Math.random() * 30
      const actual = planned + (Math.random() * 15 - 5)
      const deviation = Math.abs(actual - planned)
      mockList.push({
        id: String(i + 1),
        created_at: new Date(Date.now() - i * 3600000 * 4).toISOString(),
        updated_at: new Date(Date.now() - i * 3600000 * 4).toISOString(),
        schedule_id: String((i % 5) + 1),
        gate_no: `${(i % 3) + 1}号闸门`,
        actual_opening: actual,
        actual_discharge: 25 + Math.random() * 40,
        record_time: new Date(Date.now() - i * 3600000 * 4).toISOString(),
        deviation: deviation,
        is_deviation_exceeded: deviation > 5,
        deviation_reason: deviation > 5 ? '设备故障临时调整' : '',
        operator_name: ['操作员A', '操作员B', '操作员C'][i % 3],
      })
    }
    setList(mockList)
  }

  const handleSubmit = async () => {
    if (!form.actual_opening || !form.actual_discharge) {
      alert('请填写完整信息')
      return
    }
    const selectedSchedule = schedules.find((s) => s.id === form.schedule_id)
    const deviation = selectedSchedule
      ? Math.abs(parseFloat(form.actual_opening) - selectedSchedule.planned_opening)
      : 0
    if (deviation > 5 && !form.deviation_reason) {
      alert(`闸门开度偏差 ${deviation.toFixed(2)}% 超过阈值（5%），请填写偏差原因！`)
      return
    }
    try {
      const data = {
        ...form,
        actual_opening: parseFloat(form.actual_opening),
        actual_discharge: parseFloat(form.actual_discharge),
      }
      await gateActualApi.create(data)
      setModalVisible(false)
      resetForm()
      fetchList()
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const resetForm = () => {
    setForm({
      schedule_id: '',
      gate_no: '1号闸门',
      actual_opening: '',
      actual_discharge: '',
      deviation_reason: '',
      operator_name: '',
    })
  }

  const selectedSchedule = schedules.find((s) => s.id === form.schedule_id)
  const currentDeviation = selectedSchedule && form.actual_opening
    ? Math.abs(parseFloat(form.actual_opening) - selectedSchedule.planned_opening)
    : 0

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">实际开度</div>
        <div className="page-desc">记录闸门实际开度，超过偏差阈值需追踪原因</div>
      </div>

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
          <label>仅看超偏差:</label>
          <select value={filters.only_deviation} onChange={(e) => setFilters({ ...filters, only_deviation: e.target.value })}>
            <option value="">全部</option>
            <option value="true">是</option>
            <option value="false">否</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setModalVisible(true)}>
          + 记录实际开度
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>记录时间</th>
            <th>闸门</th>
            <th>关联调度</th>
            <th>实际开度 (%)</th>
            <th>实际下泄 (m³/s)</th>
            <th>偏差 (%)</th>
            <th>是否超阈值</th>
            <th>偏差原因</th>
            <th>操作人</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={9} className="empty-state">加载中...</td></tr>
          ) : list.length === 0 ? (
            <tr><td colSpan={9} className="empty-state">暂无数据</td></tr>
          ) : (
            list.map((item) => (
              <tr key={item.id}>
                <td>{formatDateTime(item.record_time)}</td>
                <td>{item.gate_no}</td>
                <td>{item.schedule_id || '-'}</td>
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
                <td>{item.deviation_reason || '-'}</td>
                <td>{item.operator_name || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Modal
        visible={modalVisible}
        title="记录闸门实际开度"
        onClose={() => { setModalVisible(false); resetForm() }}
        onConfirm={handleSubmit}
        width={500}
      >
        <div className="form-row">
          <label className="form-label">关联调度计划</label>
          <select
            className="form-select"
            value={form.schedule_id}
            onChange={(e) => setForm({ ...form, schedule_id: e.target.value })}
          >
            <option value="">请选择（可选）</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.gate_no} - 计划开度 {s.planned_opening}%
              </option>
            ))}
          </select>
          {selectedSchedule && (
            <div className="alert alert-info" style={{ marginTop: 8 }}>
              该调度计划开度: {formatNumber(selectedSchedule.planned_opening)}%，
              计划下泄: {formatNumber(selectedSchedule.planned_discharge)} m³/s
            </div>
          )}
        </div>
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
          <label className="form-label required">实际开度 (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            className="form-input"
            value={form.actual_opening}
            onChange={(e) => setForm({ ...form, actual_opening: e.target.value })}
            placeholder="请输入实际开度"
          />
          {selectedSchedule && form.actual_opening && (
            <div style={{ marginTop: 4, fontSize: 12 }}>
              偏差:
              <span style={{
                color: currentDeviation > 5 ? '#ff4d4f' : '#52c41a',
                fontWeight: 600,
                marginLeft: 4,
              }}>
                {formatNumber(currentDeviation)}%
              </span>
              {currentDeviation > 5 && <span style={{ color: '#ff4d4f', marginLeft: 8 }}>已超过阈值 5%</span>}
            </div>
          )}
        </div>
        <div className="form-row">
          <label className="form-label required">实际下泄流量 (m³/s)</label>
          <input
            type="number"
            step="0.01"
            className="form-input"
            value={form.actual_discharge}
            onChange={(e) => setForm({ ...form, actual_discharge: e.target.value })}
            placeholder="请输入实际下泄流量"
          />
        </div>
        {(currentDeviation > 5) && (
          <div className="form-row">
            <label className="form-label required">偏差原因</label>
            <textarea
              className="form-textarea"
              value={form.deviation_reason}
              onChange={(e) => setForm({ ...form, deviation_reason: e.target.value })}
              placeholder="开度偏差超过阈值，请详细说明原因"
              required
            />
          </div>
        )}
        <div className="form-row">
          <label className="form-label">操作人</label>
          <input
            type="text"
            className="form-input"
            value={form.operator_name}
            onChange={(e) => setForm({ ...form, operator_name: e.target.value })}
            placeholder="请输入操作人姓名"
          />
        </div>
      </Modal>
    </div>
  )
}

export default GateActualPage
