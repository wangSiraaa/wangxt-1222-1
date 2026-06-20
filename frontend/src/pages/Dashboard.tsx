import React, { useState, useEffect } from 'react'
import ScheduleCurveChart from '@/components/ScheduleCurveChart'
import WarningStatsChart from '@/components/WarningStatsChart'
import { waterLevelApi, gateScheduleApi } from '@/services/api'
import type { WaterLevelRecord, GateSchedule } from '@/types'
import { formatDateTime, formatNumber } from '@/utils'
import '@/styles/components.css'

const Dashboard: React.FC = () => {
  const [latestWaterLevel, setLatestWaterLevel] = useState<WaterLevelRecord | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetchLatestData()
  }, [])

  const fetchLatestData = async () => {
    try {
      const [waterRes, scheduleRes] = await Promise.all([
        waterLevelApi.getLatest(),
        gateScheduleApi.list({ status: 'pending_approval' }),
      ])
      if (waterRes.data) setLatestWaterLevel(waterRes.data)
      if (scheduleRes.data) setPendingCount(scheduleRes.data.length)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setLatestWaterLevel({
        id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        record_time: new Date().toISOString(),
        upstream_inflow: 45.5,
        downstream_water_level: 33.2,
        reservoir_level: 42.8,
        operator_name: '系统模拟',
      })
      setPendingCount(3)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">调度总览</div>
        <div className="page-desc">实时监控水库水位、闸门调度和预警情况</div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-title">下游水位 (m)</div>
          <div className={`stat-card-value ${latestWaterLevel && latestWaterLevel.downstream_water_level >= 35 ? 'error' : ''}`}>
            {latestWaterLevel ? formatNumber(latestWaterLevel.downstream_water_level) : '-'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
            警戒值: 35.00 m
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">上游来水 (m³/s)</div>
          <div className="stat-card-value">
            {latestWaterLevel ? formatNumber(latestWaterLevel.upstream_inflow) : '-'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">待审批调度</div>
          <div className="stat-card-value warning">{pendingCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">最小生态流量 (m³/s)</div>
          <div className="stat-card-value success">10.00</div>
        </div>
      </div>

      <ScheduleCurveChart height={350} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <WarningStatsChart />
        <div className="chart-container">
          <h3 className="section-title">最新水位记录</h3>
          {latestWaterLevel ? (
            <div className="info-grid">
              <div className="info-item">
                <span className="info-item-label">记录时间</span>
                <span className="info-item-value">{formatDateTime(latestWaterLevel.record_time)}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">上游来水</span>
                <span className="info-item-value">{formatNumber(latestWaterLevel.upstream_inflow)} m³/s</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">下游水位</span>
                <span className="info-item-value" style={latestWaterLevel.downstream_water_level >= 35 ? { color: '#ff4d4f', fontWeight: 600 } : undefined}>
                  {formatNumber(latestWaterLevel.downstream_water_level)} m
                </span>
              </div>
              <div className="info-item">
                <span className="info-item-label">库水位</span>
                <span className="info-item-value">{formatNumber(latestWaterLevel.reservoir_level)} m</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">录入人</span>
                <span className="info-item-value">{latestWaterLevel.operator_name || '-'}</span>
              </div>
            </div>
          ) : (
            <div className="empty-state">暂无数据</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
