import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ecologicalFlowApi, gateScheduleApi } from '@/services/api'
import type { EcologicalFlowConfirmation, GateSchedule } from '@/types'
import { formatDateTime, formatNumber, getStatusColor, getStatusText } from '@/utils'
import Modal from '@/components/Modal'
import '@/styles/table.css'
import '@/styles/form.css'

const EcologicalFlowPage: React.FC = () => {
  const navigate = useNavigate()
  const [list, setList] = useState<EcologicalFlowConfirmation[]>([])
  const [schedules, setSchedules] = useState<GateSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [confirmModal, setConfirmModal] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<EcologicalFlowConfirmation | null>(null)
  const [filters, setFilters] = useState({ status: '' })
  const [form, setForm] = useState({
    schedule_id: '',
    min_required_flow: '10.00',
    confirmed_flow: '',
    compensation_note: '',
    confirmer_name: '',
  })
  const [confirmForm, setConfirmForm] = useState({
    confirmed_flow: '',
    compensation_note: '',
    confirmer_name: '',
  })

  const MIN_ECO_FLOW = 10.0

  useEffect(() => {
    fetchList()
    fetchSchedules()
  }, [filters])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await ecologicalFlowApi.list(filters)
      if (res.data) setList(res.data)
    } catch (error) {
      console.error('Failed to fetch ecological flow list:', error)
      generateMockData()
    } finally {
      setLoading(false)
    }
  }

  const fetchSchedules = async () => {
    try {
      const res = await gateScheduleApi.list()
      if (res.data) setSchedules(res.data)
    } catch (error) {
      setSchedules([])
    }
  }

  const generateMockData = () => {
    const statuses: EcologicalFlowConfirmation['status'][] = ['pending', 'confirmed']
    const mockList: EcologicalFlowConfirmation[] = []
    for (let i = 0; i < 6; i++) {
      const flow = 8 + Math.random() * 8
      mockList.push({
        id: String(i + 1),
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        updated_at: new Date(Date.now() - i * 86400000).toISOString(),
        schedule_id: String(i + 1),
        min_required_flow: MIN_ECO_FLOW,
        confirmed_flow: flow,
        is_sufficient: flow >= MIN_ECO_FLOW,
        compensation_note: flow < MIN_ECO_FLOW ? '通过生态补水措施补偿' : '',
        confirmed_at: statuses[i % 2] === 'confirmed' ? new Date(Date.now() - i * 86400000).toISOString() : undefined,
        confirmer_name: ['生态专员A', '生态专员B'][i % 2],
        status: statuses[i % 2],
      })
    }
    setList(mockList)
  }

  const handleSubmit = async () => {
    if (!form.confirmed_flow) {
      alert('请填写确认下泄流量')
      return
    }
    const flow = parseFloat(form.confirmed_flow)
    if (flow < MIN_ECO_FLOW && !form.compensation_note) {
      alert(`确认流量 ${flow.toFixed(2)} m³/s 低于最小生态流量 (${MIN_ECO_FLOW} m³/s)，请填写补偿说明！`)
      return
    }
    try {
      const data = {
        ...form,
        min_required_flow: parseFloat(form.min_required_flow),
        confirmed_flow: flow,
      }
      await ecologicalFlowApi.create(data)
      setModalVisible(false)
      resetForm()
      fetchList()
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const handleConfirm = async () => {
    if (!currentRecord || !confirmForm.confirmed_flow) {
      alert('请填写确认信息')
      return
    }
    const flow = parseFloat(confirmForm.confirmed_flow)
    if (flow < MIN_ECO_FLOW && !confirmForm.compensation_note) {
      alert(`确认流量低于最小生态流量，请填写补偿说明！`)
      return
    }
    try {
      await ecologicalFlowApi.confirm(currentRecord.id, confirmForm)
      setConfirmModal(false)
      setCurrentRecord(null)
      setConfirmForm({ confirmed_flow: '', compensation_note: '', confirmer_name: '' })
      fetchList()
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const openConfirmModal = (record: EcologicalFlowConfirmation) => {
    setCurrentRecord(record)
    setConfirmForm({
      confirmed_flow: String(record.confirmed_flow),
      compensation_note: record.compensation_note || '',
      confirmer_name: '',
    })
    setConfirmModal(true)
  }

  const resetForm = () => {
    setForm({
      schedule_id: '',
      min_required_flow: '10.00',
      confirmed_flow: '',
      compensation_note: '',
      confirmer_name: '',
    })
  }

  const confirmedFlow = parseFloat(form.confirmed_flow || '0')

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">生态流量确认</div>
        <div className="page-desc">生态专员确认最小下泄流量，不足需生成补偿说明</div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        📌 最小生态流量要求: <strong>{MIN_ECO_FLOW} m³/s</strong>，确认流量低于此值需填写补偿说明
      </div>

      <div className="filter-bar">
        <div className="filter-item">
          <label>状态:</label>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">全部</option>
            <option value="pending">待确认</option>
            <option value="confirmed">已确认</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setModalVisible(true)}>
          + 新建确认单
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>创建时间</th>
            <th>关联调度</th>
            <th>最小要求 (m³/s)</th>
            <th>确认流量 (m³/s)</th>
            <th>是否满足</th>
            <th>补偿说明</th>
            <th>确认人</th>
            <th>确认时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={10} className="empty-state">加载中...</td></tr>
          ) : list.length === 0 ? (
            <tr><td colSpan={10} className="empty-state">暂无数据</td></tr>
          ) : (
            list.map((item) => (
              <tr key={item.id}>
                <td>{formatDateTime(item.created_at)}</td>
                <td>
                  {item.schedule_id ? (
                    <a
                      className="table-link"
                      onClick={(e) => { e.preventDefault(); navigate(`/gate-schedule/${item.schedule_id}`) }}
                    >
                      {item.schedule_id}
                    </a>
                  ) : '-'}
                </td>
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
                <td>
                  {item.status === 'pending' && (
                    <button className="btn btn-sm btn-success" onClick={() => openConfirmModal(item)}>确认</button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Modal
        visible={modalVisible}
        title="新建生态流量确认单"
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
                {s.gate_no} - 计划下泄 {formatNumber(s.planned_discharge)} m³/s
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label className="form-label required">最小生态流量 (m³/s)</label>
          <input
            type="number"
            step="0.01"
            className="form-input"
            value={form.min_required_flow}
            onChange={(e) => setForm({ ...form, min_required_flow: e.target.value })}
            readOnly
            style={{ background: '#f5f5f5' }}
          />
        </div>
        <div className="form-row">
          <label className="form-label required">确认下泄流量 (m³/s)</label>
          <input
            type="number"
            step="0.01"
            className="form-input"
            value={form.confirmed_flow}
            onChange={(e) => setForm({ ...form, confirmed_flow: e.target.value })}
            placeholder="请输入确认下泄流量"
          />
          {form.confirmed_flow && confirmedFlow < MIN_ECO_FLOW && (
            <div className="alert alert-warning" style={{ marginTop: 8 }}>
              ⚠️ 确认流量低于最小生态流量要求，必须填写补偿说明
            </div>
          )}
        </div>
        {confirmedFlow < MIN_ECO_FLOW && (
          <div className="form-row">
            <label className="form-label required">补偿说明</label>
            <textarea
              className="form-textarea"
              value={form.compensation_note}
              onChange={(e) => setForm({ ...form, compensation_note: e.target.value })}
              placeholder="请说明生态流量不足的补偿措施"
              required
            />
          </div>
        )}
        <div className="form-row">
          <label className="form-label">确认人</label>
          <input
            type="text"
            className="form-input"
            value={form.confirmer_name}
            onChange={(e) => setForm({ ...form, confirmer_name: e.target.value })}
            placeholder="请输入生态专员姓名"
          />
        </div>
      </Modal>

      <Modal
        visible={confirmModal}
        title="确认生态流量"
        onClose={() => { setConfirmModal(false); setCurrentRecord(null) }}
        onConfirm={handleConfirm}
        width={500}
      >
        {currentRecord && (
          <>
            <div className="info-grid" style={{ marginBottom: 16 }}>
              <div className="info-item">
                <span className="info-item-label">最小要求</span>
                <span className="info-item-value">{formatNumber(currentRecord.min_required_flow)} m³/s</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">原定流量</span>
                <span className="info-item-value">{formatNumber(currentRecord.confirmed_flow)} m³/s</span>
              </div>
            </div>
            <div className="form-row">
              <label className="form-label required">实际确认流量 (m³/s)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={confirmForm.confirmed_flow}
                onChange={(e) => setConfirmForm({ ...confirmForm, confirmed_flow: e.target.value })}
              />
            </div>
            {parseFloat(confirmForm.confirmed_flow || '0') < MIN_ECO_FLOW && (
              <div className="form-row">
                <label className="form-label required">补偿说明</label>
                <textarea
                  className="form-textarea"
                  value={confirmForm.compensation_note}
                  onChange={(e) => setConfirmForm({ ...confirmForm, compensation_note: e.target.value })}
                  placeholder="请说明生态流量不足的补偿措施"
                  required
                />
              </div>
            )}
            <div className="form-row">
              <label className="form-label required">确认人</label>
              <input
                type="text"
                className="form-input"
                value={confirmForm.confirmer_name}
                onChange={(e) => setConfirmForm({ ...confirmForm, confirmer_name: e.target.value })}
                placeholder="请输入生态专员姓名"
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

export default EcologicalFlowPage
