import React, { useState, useEffect } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { warningApi } from '@/services/api'

const WarningStatsChart: React.FC = () => {
  const [stats, setStats] = useState<Record<string, number>>({
    total: 0,
    unhandled: 0,
    high: 0,
    medium: 0,
    low: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await warningApi.stats()
      if (res.data) {
        setStats(res.data)
      }
    } catch (error) {
      console.error('Failed to fetch warning stats:', error)
      setStats({ total: 12, unhandled: 5, high: 2, medium: 4, low: 6 })
    }
  }

  const data = [
    { name: '高预警', value: stats.high, color: '#ff4d4f' },
    { name: '中预警', value: stats.medium, color: '#faad14' },
    { name: '低预警', value: stats.low, color: '#52c41a' },
  ]

  return (
    <div className="chart-container" style={{ padding: 16 }}>
      <h3 className="section-title">预警统计</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <div>
            <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, marginBottom: 4 }}>预警总数</div>
            <div style={{ fontSize: 32, fontWeight: 600 }}>{stats.total}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, marginBottom: 4 }}>未处理预警</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#ff4d4f' }}>{stats.unhandled}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WarningStatsChart
