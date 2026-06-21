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
  Scatter,
  Cell,
} from 'recharts'
import type { ScheduleCurveData } from '@/types'
import { gateScheduleApi } from '@/services/api'
import '@/styles/components.css'

interface Props {
  startDate?: string
  endDate?: string
  height?: number
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props
  if (payload && payload.is_deviation_exceeded) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#ff4d4f"
        stroke="#fff"
        strokeWidth={2}
      />
    )
  }
  return null
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
      const planned = 30 + Math.sin((168 - i) / 6) * 20
      const actual = planned + (Math.random() * 10 - 5)
      const deviation = Math.abs(actual - planned)
      mockData.push({
        time: time.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        planned_discharge: planned,
        actual_discharge: actual,
        water_level: 32 + Math.sin((168 - i) / 20) * 3,
        inflow: 40 + Math.cos((168 - i) / 8) * 15,
        deviation: deviation,
        is_deviation_exceeded: deviation > 5,
      })
    }
    setData(mockData)
  }

  const exceededCount = data.filter(d => d.is_deviation_exceeded).length

  if (loading) {
    return <div className="chart-container" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'rgba(0,0,0,0.45)' }}>加载中...</span>
    </div>
  }

  return (
    <div className="chart-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 className="section-title" style={{ margin: 0 }}>调度曲线监控</h3>
        {exceededCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ff4d4f' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff4d4f', display: 'inline-block' }} />
            <span>偏差超限 {exceededCount} 处</span>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} interval={23} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} label={{ value: '流量(m³/s)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} label={{ value: '水位(m)', angle: 90, position: 'insideRight' }} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 4 }}
            formatter={(value: number, name: string, props: any) => {
              const payload = props.payload
              if (name === '实际下泄' && payload && payload.is_deviation_exceeded) {
                return [
                  `${value.toFixed(2)} (偏差超限!)`,
                  name,
                ]
              }
              return [value.toFixed(2), name]
            }}
          />
          <Legend formatter={(value) => {
            if (value === '偏差超限') {
              return <span style={{ color: '#ff4d4f' }}>● {value}</span>
            }
            return value
          }} />
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
            dot={<CustomDot />}
            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
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
