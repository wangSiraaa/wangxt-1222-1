import React, { useState, useEffect } from 'react'
import { waterSupplyApi, gateScheduleApi } from '@/services/api'
import type { WaterSupplyImpact, GateSchedule } from '@/types'
import { formatDateTime, formatNumber, getWarningLevelColor } from '@/utils'
import Modal from '@/components/Modal'
import '@/styles/table.css'
import '@/styles/form.css'

const WaterSupplyPage: React.FC = () => {
  const [list, setList] = useState<WaterSupplyImpact[]>([])
  const [schedules, setSchedules] = useState<GateSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [generateModal, setGenerateModal] = useState(false)
  const [filters, setFilters] = useState({ water_supply_unit: '' })
  const [form, setForm] = useState({
    schedule_id: '',
    water_supply_unit: '',
    estimated_intake: '',
    impact_level: '',
    impact_desc: '',
    viewer_name: '',
  })
  const [generateForm, setGenerateForm] = useState({
    schedule_id: '',
    water_supply_unit: '',
  })

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

  useEffect(() => {
    fetchList()
    fetchSchedules()
  }, [filters])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await waterSupplyApi.list(filters)
      if (res.data) setList(res.data)
    } catch (error) {
      console.error('Failed to fetch water supply list:', error)
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
    const levels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high']
    const units = ['城东自来水厂', '城西工业区', '农业灌溉区', '生态补水站']
    const mockList: WaterSupplyImpact[] = []
    for (let i = 0; i < 7; i++) {
      mockList.push({
        id: String(i + 1),
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        updated_at: new Date(Date.now() - i * 86400000).toISOString(),
        schedule_id: String((i % 5) + 1),
        water_supply_unit: units[i % units.length],
        estimated_intake: 5 + Math.random() * 20,
        impact_level: levels[i % 3],
        impact_desc: [
          '下泄流量充足，取水基本不受影响',
          '下泄流量中等，对取水有一定影响',
          '下泄流量较小，可能严重影响取水',
        ][i % 3],
        viewed_at: i > 2 ? new Date(Date.now() - i * 86400000 + 3600000).toISOString() : undefined,
        viewer_name: i > 2 ? ['水厂王工', '灌溉站李工'][i % 2] : undefined,
      })
    }
    setList(mockList)
  }

  const handleCreate = async () => {
    if (!form.water_supply_unit) {
      alert('请填写供水单位')
      return
    }
    try {
      const data: Partial<WaterSupplyImpact> = {
        schedule_id: form.schedule_id || undefined,
        water_supply_unit: form.water_supply_unit,
        estimated_intake: form.estimated_intake ? parseFloat(form.estimated_intake) : undefined,
        impact_level: form.impact_level ? (form.impact_level as 'low' | 'medium' | 'high') : undefined,
        impact_desc: form.impact_desc || undefined,
        viewer_name: form.viewer_name || undefined,
      }
      await waterSupplyApi.create(data)
      setModalVisible(false)
      resetForm()
      fetchList()
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const handleGenerate = async () => {
    if (!generateForm.schedule_id || !generateForm.water_supply_unit) {
      alert('请选择调度计划和供水单位')
      return
    }
    try {
      await waterSupplyApi.generateImpact(generateForm.schedule_id, {
        water_supply_unit: generateForm.water_supply_unit,
      })
      setGenerateModal(false)
      setGenerateForm({ schedule_id: '', water_supply_unit: '' })
      fetchList()
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const handleMarkViewed = async (item: WaterSupplyImpact) => {
    try {
      await waterSupplyApi.markViewed(item.id, { viewer_name: '供水单位查看员' })
      fetchList()
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const resetForm = () => {
    setForm({
      schedule_id: '',
      water_supply_unit: '',
      estimated_intake: '',
      impact_level: '',
      impact_desc: '',
      viewer_name: '',
    })
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">供水影响查看</div>
        <div className="page-desc">供水单位查看调度计划对取水的影响</div>
      </div>

      <div className="filter-bar">
        <div className="filter-item">
          <label>供水单位:</label>
          <input
            type="text"
            value={filters.water_supply_unit}
            onChange={(e) => setFilters({ ...filters, water_supply_unit: e.target.value })}
            placeholder="搜索供水单位"
          />
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-warning" onClick={() => setGenerateModal(true)}>
          📊 智能评估影响
        </button>
        <button className="btn btn-primary" onClick={() => setModalVisible(true)}>
          + 新增影响记录
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>创建时间</th>
            <th>关联调度</th>
            <th>供水单位</th>
            <th>预估取水量 (m³/s)</th>
            <th>影响等级</th>
            <th>影响说明</th>
            <th>查看状态</th>
            <th>查看人</th>
            <th>操作</th>
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
                <td>{formatDateTime(item.created_at)}</td>
                <td>{item.schedule_id || '-'}</td>
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
                <td>
                  {!item.viewed_at && (
                    <button className="btn btn-sm btn-success" onClick={() => handleMarkViewed(item)}>标记已查看</button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Modal
        visible={modalVisible}
        title="新增供水影响记录"
        onClose={() => { setModalVisible(false); resetForm() }}
        onConfirm={handleCreate}
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
          <label className="form-label required">供水单位</label>
          <input
            type="text"
            className="form-input"
            value={form.water_supply_unit}
            onChange={(e) => setForm({ ...form, water_supply_unit: e.target.value })}
            placeholder="请输入供水单位名称"
          />
        </div>
        <div className="form-row">
          <label className="form-label">预估取水量 (m³/s)</label>
          <input
            type="number"
            step="0.01"
            className="form-input"
            value={form.estimated_intake}
            onChange={(e) => setForm({ ...form, estimated_intake: e.target.value })}
            placeholder="请输入预估取水量"
          />
        </div>
        <div className="form-row">
          <label className="form-label">影响等级</label>
          <select
            className="form-select"
            value={form.impact_level}
            onChange={(e) => setForm({ ...form, impact_level: e.target.value })}
          >
            <option value="">请选择</option>
            <option value="low">低影响</option>
            <option value="medium">中影响</option>
            <option value="high">高影响</option>
          </select>
        </div>
        <div className="form-row">
          <label className="form-label">影响说明</label>
          <textarea
            className="form-textarea"
            value={form.impact_desc}
            onChange={(e) => setForm({ ...form, impact_desc: e.target.value })}
            placeholder="请输入影响说明"
          />
        </div>
      </Modal>

      <Modal
        visible={generateModal}
        title="智能评估供水影响"
        onClose={() => setGenerateModal(false)}
        onConfirm={handleGenerate}
        width={500}
      >
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          系统将根据调度计划的下泄流量自动评估对供水单位取水的影响
        </div>
        <div className="form-row">
          <label className="form-label required">选择调度计划</label>
          <select
            className="form-select"
            value={generateForm.schedule_id}
            onChange={(e) => setGenerateForm({ ...generateForm, schedule_id: e.target.value })}
          >
            <option value="">请选择调度计划</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.gate_no} - 计划下泄 {formatNumber(s.planned_discharge)} m³/s
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label className="form-label required">供水单位</label>
          <select
            className="form-select"
            value={generateForm.water_supply_unit}
            onChange={(e) => setGenerateForm({ ...generateForm, water_supply_unit: e.target.value })}
          >
            <option value="">请选择供水单位</option>
            <option value="城东自来水厂">城东自来水厂</option>
            <option value="城西工业区">城西工业区</option>
            <option value="农业灌溉区">农业灌溉区</option>
            <option value="生态补水站">生态补水站</option>
          </select>
        </div>
      </Modal>
    </div>
  )
}

export default WaterSupplyPage
