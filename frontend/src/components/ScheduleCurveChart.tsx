import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  ReferenceLine,
} from 'recharts'
import type { ScheduleCurveData } from '@/types'
import { gateScheduleApi } from '@/services/api'
import '@/styles/components.css'

interface Props {
  startDate?: string
  endDate?: string
  height?: number
}

const ScheduleCurveChart: React.FC<Props> = ({ startDate, endDate, height = 400 }) => {
  const [data, setData] = useState<ScheduleCurveData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [startDate, endDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await gateScheduleApi.getCurve({ start_date: startDate, end_date: endDate })
      if (res.data) {
        setData(res.data)
      }
    } catch (error) {
      console.error('Failed to fetch curve data:', error)
      generateMockData()
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = () => {
    const mockData: ScheduleCurveData[] = []
    const now = new Date()
    for (let i = 168; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      mockData.push({
        time: time.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        planned_discharge: 30 + Math.sin((168 - i) / 6) * 20,
        actual_discharge: 30 + Math.sin((168 - i) / 6) * 20 + (Math.random() * 10 - 5),
        water_level: 32 + Math.sin((168 - i) / 20) * 3,
        inflow: 40 + Math.cos((168 - i) / 8) * 15,
      })
    }
    setData(mockData)
  }

  if (loading) {
    return <div className="chart-container" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'rgba(0,0,0,0.45)' }}>加载中...</span>
    </div>
  }

  return (
    <div className="chart-container">
      <h3 className="section-title">调度曲线监控</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} interval={23} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} label={{ value: '流量(m³/s)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} label={{ value: '水位(m)', angle: 90, position: 'insideRight' }} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 4 }}
          />
          <Legend />
          <ReferenceLine yAxisId="right" y={35} stroke="#ff4d4f" strokeDasharray="5 5" label={{ value: '警戒水位', fill: '#ff4d4f', fontSize: 12 }} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="inflow"
            name="上游来水"
            fill="rgba(82, 196, 26, 0.2)"
            stroke="#52c41a"
            strokeWidth={2}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="planned_discharge"
            name="计划下泄"
            stroke="#1890ff"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="actual_discharge"
            name="实际下泄"
            stroke="#722ed1"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="water_level"
            name="下游水位"
            stroke="#fa8c16"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ScheduleCurveChart
