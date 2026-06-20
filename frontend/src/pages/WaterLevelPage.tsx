import React, { useState, useEffect } from 'react'
import { waterLevelApi } from '@/services/api'
import type { WaterLevelRecord } from '@/types'
import { formatDateTime, formatNumber } from '@/utils'
import Modal from '@/components/Modal'
import '@/styles/table.css'
import '@/styles/form.css'

const WaterLevelPage: React.FC = () => {
  const [list, setList] = useState<WaterLevelRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState<WaterLevelRecord | null>(null)
  const [filters, setFilters] = useState({ start_date: '', end_date: '' })
  const [form, setForm] = useState({
    upstream_inflow: '',
    downstream_water_level: '',
    reservoir_level: '',
    operator_name: '',
    remark: '',
  })

  useEffect(() => {
    fetchList()
  }, [filters])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await waterLevelApi.list(filters)
      if (res.data) setList(res.data)
    } catch (error) {
      console.error('Failed to fetch water level list:', error)
      generateMockData()
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = () => {
    const mockList: WaterLevelRecord[] = []
    for (let i = 0; i < 10; i++) {
      mockList.push({
        id: String(i + 1),
        created_at: new Date(Date.now() - i * 3600000 * 6).toISOString(),
        updated_at: new Date(Date.now() - i * 3600000 * 6).toISOString(),
        record_time: new Date(Date.now() - i * 3600000 * 6).toISOString(),
        upstream_inflow: 40 + Math.random() * 20,
        downstream_water_level: 32 + Math.random() * 3,
        reservoir_level: 42 + Math.random() * 2,
        operator_name: ['张三', '李四', '王五'][i % 3],
      })
    }
    setList(mockList)
  }

  const handleSubmit = async () => {
    try {
      const data = {
        ...form,
        upstream_inflow: parseFloat(form.upstream_inflow),
        downstream_water_level: parseFloat(form.downstream_water_level),
        reservoir_level: form.reservoir_level ? parseFloat(form.reservoir_level) : undefined,
      }
      if (editing) {
        await waterLevelApi.update(editing.id, data)
      } else {
        await waterLevelApi.create(data)
      }
      setModalVisible(false)
      resetForm()
      fetchList()
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此记录？')) return
    try {
      await waterLevelApi.remove(id)
      fetchList()
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const handleEdit = (record: WaterLevelRecord) => {
    setEditing(record)
    setForm({
      upstream_inflow: String(record.upstream_inflow),
      downstream_water_level: String(record.downstream_water_level),
      reservoir_level: String(record.reservoir_level || ''),
      operator_name: record.operator_name || '',
      remark: record.remark || '',
    })
    setModalVisible(true)
  }

  const resetForm = () => {
    setEditing(null)
    setForm({
      upstream_inflow: '',
      downstream_water_level: '',
      reservoir_level: '',
      operator_name: '',
      remark: '',
    })
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">水位录入</div>
        <div className="page-desc">调度员录入上游来水、下游水位等水文数据</div>
      </div>

      <div className="filter-bar">
        <div className="filter-item">
          <label>开始日期:</label>
          <input type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
        </div>
        <div className="filter-item">
          <label>结束日期:</label>
          <input type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
        </div>
        <button className="btn btn-primary" onClick={() => setModalVisible(true)}>
          + 新增水位记录
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>记录时间</th>
            <th>上游来水 (m³/s)</th>
            <th>下游水位 (m)</th>
            <th>库水位 (m)</th>
            <th>录入人</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} className="empty-state">加载中...</td></tr>
          ) : list.length === 0 ? (
            <tr><td colSpan={7} className="empty-state">暂无数据</td></tr>
          ) : (
            list.map((item) => (
              <tr key={item.id}>
                <td>{formatDateTime(item.record_time)}</td>
                <td>{formatNumber(item.upstream_inflow)}</td>
                <td style={{ color: item.downstream_water_level >= 35 ? '#ff4d4f' : 'inherit' }}>
                  {formatNumber(item.downstream_water_level)}
                  {item.downstream_water_level >= 35 && <span className="badge badge-error" style={{ marginLeft: 8 }}>超警戒</span>}
                </td>
                <td>{formatNumber(item.reservoir_level)}</td>
                <td>{item.operator_name || '-'}</td>
                <td>{item.remark || '-'}</td>
                <td>
                  <button className="btn btn-sm" onClick={() => handleEdit(item)}>编辑</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>删除</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Modal
        visible={modalVisible}
        title={editing ? '编辑水位记录' : '新增水位记录'}
        onClose={() => { setModalVisible(false); resetForm() }}
        onConfirm={handleSubmit}
        width={500}
      >
        <div className="form-row">
          <label className="form-label required">上游来水 (m³/s)</label>
          <input
            type="number"
            step="0.01"
            className="form-input"
            value={form.upstream_inflow}
            onChange={(e) => setForm({ ...form, upstream_inflow: e.target.value })}
            placeholder="请输入上游来水流量"
          />
        </div>
        <div className="form-row">
          <label className="form-label required">下游水位 (m)</label>
          <input
            type="number"
            step="0.01"
            className="form-input"
            value={form.downstream_water_level}
            onChange={(e) => setForm({ ...form, downstream_water_level: e.target.value })}
            placeholder="请输入下游水位"
          />
          {parseFloat(form.downstream_water_level) >= 35 && (
            <div className="alert alert-warning" style={{ marginTop: 8 }}>
              ⚠️ 下游水位已超过警戒值（35.00m），将触发高预警
            </div>
          )}
        </div>
        <div className="form-row">
          <label className="form-label">库水位 (m)</label>
          <input
            type="number"
            step="0.01"
            className="form-input"
            value={form.reservoir_level}
            onChange={(e) => setForm({ ...form, reservoir_level: e.target.value })}
            placeholder="请输入库水位"
          />
        </div>
        <div className="form-row">
          <label className="form-label">录入人</label>
          <input
            type="text"
            className="form-input"
            value={form.operator_name}
            onChange={(e) => setForm({ ...form, operator_name: e.target.value })}
            placeholder="请输入录入人姓名"
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
    </div>
  )
}

export default WaterLevelPage
