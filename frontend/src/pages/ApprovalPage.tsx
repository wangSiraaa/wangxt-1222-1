import React, { useState, useEffect } from 'react'
import { approvalApi } from '@/services/api'
import type { ApprovalRecord } from '@/types'
import { formatDateTime } from '@/utils'
import '@/styles/table.css'

const ApprovalPage: React.FC = () => {
  const [list, setList] = useState<ApprovalRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ business_type: '' })

  useEffect(() => {
    fetchList()
  }, [filters])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await approvalApi.list(filters)
      if (res.data) setList(res.data)
    } catch (error) {
      console.error('Failed to fetch approval list:', error)
      generateMockData()
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = () => {
    const types = ['gate_schedule', 'ecological_flow', 'water_supply']
    const results = ['submitted', 'approved', 'rejected']
    const mockList: ApprovalRecord[] = []
    for (let i = 0; i < 15; i++) {
      mockList.push({
        id: String(i + 1),
        created_at: new Date(Date.now() - i * 3600000 * 12).toISOString(),
        updated_at: new Date(Date.now() - i * 3600000 * 12).toISOString(),
        business_id: String((i % 8) + 1),
        business_type: types[i % 3],
        approval_type: i === 0 ? 'submit' : 'approval',
        approver_name: ['审批员A', '审批员B', '审批员C'][i % 3],
        approval_result: results[i % 3],
        approval_opinion: i % 3 === 2 ? '流量不符合防洪要求，驳回' : i % 3 === 1 ? '同意执行' : '提交审批',
        approved_at: new Date(Date.now() - i * 3600000 * 12).toISOString(),
      })
    }
    setList(mockList)
  }

  const businessTypeText = (type: string) => {
    switch (type) {
      case 'gate_schedule': return '闸门调度'
      case 'ecological_flow': return '生态流量'
      case 'water_supply': return '供水影响'
      default: return type
    }
  }

  const resultText = (result: string) => {
    switch (result) {
      case 'submitted': return { text: '已提交', color: '#1890ff' }
      case 'approved': return { text: '已通过', color: '#52c41a' }
      case 'rejected': return { text: '已驳回', color: '#ff4d4f' }
      default: return { text: result, color: '#8c8c8c' }
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">审批记录</div>
        <div className="page-desc">查看所有业务的审批历史记录</div>
      </div>

      <div className="filter-bar">
        <div className="filter-item">
          <label>业务类型:</label>
          <select value={filters.business_type} onChange={(e) => setFilters({ ...filters, business_type: e.target.value })}>
            <option value="">全部</option>
            <option value="gate_schedule">闸门调度</option>
            <option value="ecological_flow">生态流量</option>
            <option value="water_supply">供水影响</option>
          </select>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>审批时间</th>
            <th>业务类型</th>
            <th>业务ID</th>
            <th>审批类型</th>
            <th>审批结果</th>
            <th>审批人</th>
            <th>审批意见</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} className="empty-state">加载中...</td></tr>
          ) : list.length === 0 ? (
            <tr><td colSpan={7} className="empty-state">暂无数据</td></tr>
          ) : (
            list.map((item) => {
              const result = resultText(item.approval_result)
              return (
                <tr key={item.id}>
                  <td>{formatDateTime(item.approved_at)}</td>
                  <td>{businessTypeText(item.business_type)}</td>
                  <td>{item.business_id}</td>
                  <td>{item.approval_type === 'submit' ? '提交' : '审批'}</td>
                  <td>
                    <span className="badge" style={{
                      background: result.color + '20',
                      color: result.color,
                      border: `1px solid ${result.color}40`,
                    }}>
                      {result.text}
                    </span>
                  </td>
                  <td>{item.approver_name || '-'}</td>
                  <td>{item.approval_opinion || '-'}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export default ApprovalPage
