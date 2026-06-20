import React, { useState, useEffect } from 'react'
import { warningApi } from '@/services/api'
import type { WarningRecord } from '@/types'
import { formatDateTime, getWarningLevelColor, getWarningLevelText } from '@/utils'
import Modal from '@/components/Modal'
import '@/styles/table.css'
import '@/styles/form.css'

const WarningPage: React.FC = () => {
  const [list, setList] = useState<WarningRecord[]>([])
  const [stats, setStats] = useState<Record<string, number>>({ total: 0, unhandled: 0 })
  const [loading, setLoading] = useState(false)
  const [handleModal, setHandleModal] = useState(false)
  const [currentWarning, setCurrentWarning] = useState<WarningRecord | null>(null)
  const [filters, setFilters] = useState({ warning_type: '', warning_level: '', is_handled: '' })
  const [handleForm, setHandleForm] = useState({ handler_name: '', handle_remark: '' })

  useEffect(() => {
    fetchList()
    fetchStats()
  }, [filters])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await warningApi.list(filters)
      if (res.data) setList(res.data)
    } catch (error) {
      console.error('Failed to fetch warning list:', error)
      generateMockData()
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await warningApi.stats()
      if (res.data) setStats(res.data)
    } catch (error) {
      setStats({ total: 12, unhandled: 5, high: 2, medium: 4, low: 6 })
    }
  }

  const generateMockData = () => {
    const types = ['water_level', 'gate_deviation', 'ecological_flow']
    const levels: Array<'low' | 'medium' | 'high'> = ['high', 'medium', 'low']
    const msgs = [
      '下游水位超过警戒水位',
      '闸门实际开度与计划偏差过大',
      '生态流量不足，需要补偿说明',
    ]
    const mockList: WarningRecord[] = []
    for (let i = 0; i < 10; i++) {
      mockList.push({
        id: String(i + 1),
        created_at: new Date(Date.now() - i * 3600000 * 8).toISOString(),
        updated_at: new Date(Date.now() - i * 3600000 * 8).toISOString(),
        warning_type: types[i % 3],
        warning_level: levels[i % 3],
        warning_msg: msgs[i % 3],
        business_id: String((i % 5) + 1),
        business_type: types[i % 3],
        is_handled: i >= 5,
        handled_at: i >= 5 ? new Date(Date.now() - i * 3600000 * 8 + 3600000 * 2).toISOString() : undefined,
        handler_name: i >= 5 ? ['处理员A', '处理员B'][i % 2] : undefined,
        handle_remark: i >= 5 ? '已采取相应措施处理' : undefined,
      })
    }
    setList(mockList)
  }

  const warningTypeText = (type: string) => {
    switch (type) {
      case 'water_level': return '水位预警'
      case 'gate_deviation': return '闸门偏差预警'
      case 'ecological_flow': return '生态流量预警'
      default: return type
    }
  }

  const handleWarning = async () => {
    if (!currentWarning || !handleForm.handler_name) {
      alert('请填写处理人信息')
      return
    }
    try {
      await warningApi.handle(currentWarning.id, handleForm)
      setHandleModal(false)
      setCurrentWarning(null)
      setHandleForm({ handler_name: '', handle_remark: '' })
      fetchList()
      fetchStats()
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const openHandleModal = (warning: WarningRecord) => {
    setCurrentWarning(warning)
    setHandleForm({ handler_name: '', handle_remark: '' })
    setHandleModal(true)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">预警中心</div>
        <div className="page-desc">管理和处理系统预警信息</div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-title">预警总数</div>
          <div className="stat-card-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">待处理</div>
          <div className="stat-card-value error">{stats.unhandled}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">高预警</div>
          <div className="stat-card-value error">{stats.high || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">已处理</div>
          <div className="stat-card-value success">{(stats.total || 0) - (stats.unhandled || 0)}</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-item">
          <label>预警类型:</label>
          <select value={filters.warning_type} onChange={(e) => setFilters({ ...filters, warning_type: e.target.value })}>
            <option value="">全部</option>
            <option value="water_level">水位预警</option>
            <option value="gate_deviation">闸门偏差预警</option>
            <option value="ecological_flow">生态流量预警</option>
          </select>
        </div>
        <div className="filter-item">
          <label>预警等级:</label>
          <select value={filters.warning_level} onChange={(e) => setFilters({ ...filters, warning_level: e.target.value })}>
            <option value="">全部</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
        <div className="filter-item">
          <label>处理状态:</label>
          <select value={filters.is_handled} onChange={(e) => setFilters({ ...filters, is_handled: e.target.value })}>
            <option value="">全部</option>
            <option value="false">未处理</option>
            <option value="true">已处理</option>
          </select>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>预警时间</th>
            <th>预警类型</th>
            <th>预警等级</th>
            <th>预警信息</th>
            <th>关联业务</th>
            <th>处理状态</th>
            <th>处理人</th>
            <th>处理备注</th>
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
                <td>{warningTypeText(item.warning_type)}</td>
                <td>
                  <span className="badge" style={{
                    background: getWarningLevelColor(item.warning_level) + '20',
                    color: getWarningLevelColor(item.warning_level),
                    border: `1px solid ${getWarningLevelColor(item.warning_level)}40`,
                  }}>
                    {getWarningLevelText(item.warning_level)}
                  </span>
                </td>
                <td>{item.warning_msg}</td>
                <td>{item.business_id ? `${warningTypeText(item.business_type || '')} #${item.business_id}` : '-'}</td>
                <td>
                  {item.is_handled ? (
                    <span className="badge badge-success">已处理</span>
                  ) : (
                    <span className="badge badge-warning">待处理</span>
                  )}
                </td>
                <td>{item.handler_name || '-'}</td>
                <td>{item.handle_remark || '-'}</td>
                <td>
                  {!item.is_handled && (
                    <button className="btn btn-sm btn-success" onClick={() => openHandleModal(item)}>处理</button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Modal
        visible={handleModal}
        title="处理预警"
        onClose={() => { setHandleModal(false); setCurrentWarning(null) }}
        onConfirm={handleWarning}
        width={500}
      >
        {currentWarning && (
          <>
            <div className="alert" style={{
              background: getWarningLevelColor(currentWarning.warning_level) + '15',
              border: `1px solid ${getWarningLevelColor(currentWarning.warning_level)}40`,
              color: getWarningLevelColor(currentWarning.warning_level),
              marginBottom: 16,
            }}>
              <strong>{getWarningLevelText(currentWarning.warning_level)}级预警:</strong> {currentWarning.warning_msg}
            </div>
            <div className="info-grid" style={{ marginBottom: 16 }}>
              <div className="info-item">
                <span className="info-item-label">预警类型</span>
                <span className="info-item-value">{warningTypeText(currentWarning.warning_type)}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">预警时间</span>
                <span className="info-item-value">{formatDateTime(currentWarning.created_at)}</span>
              </div>
            </div>
            <div className="form-row">
              <label className="form-label required">处理人</label>
              <input
                type="text"
                className="form-input"
                value={handleForm.handler_name}
                onChange={(e) => setHandleForm({ ...handleForm, handler_name: e.target.value })}
                placeholder="请输入处理人姓名"
              />
            </div>
            <div className="form-row">
              <label className="form-label">处理备注</label>
              <textarea
                className="form-textarea"
                value={handleForm.handle_remark}
                onChange={(e) => setHandleForm({ ...handleForm, handle_remark: e.target.value })}
                placeholder="请输入处理措施和说明"
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

export default WarningPage
