import dayjs from 'dayjs'

export function formatDateTime(date?: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

export function formatDate(date?: string | Date, format = 'YYYY-MM-DD'): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

export function formatNumber(num?: number, precision = 2): string {
  if (num === undefined || num === null || isNaN(num)) return '-'
  return num.toFixed(precision)
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    draft: '#8c8c8c',
    pending_approval: '#faad14',
    approved: '#52c41a',
    rejected: '#ff4d4f',
    executed: '#1890ff',
    pending: '#faad14',
    confirmed: '#52c41a',
  }
  return colorMap[status] || '#8c8c8c'
}

export function getStatusText(status: string): string {
  const textMap: Record<string, string> = {
    draft: '草稿',
    pending_approval: '待审批',
    approved: '已通过',
    rejected: '已驳回',
    executed: '已执行',
    pending: '待确认',
    confirmed: '已确认',
  }
  return textMap[status] || status
}

export function getWarningLevelColor(level: string): string {
  const colorMap: Record<string, string> = {
    low: '#52c41a',
    medium: '#faad14',
    high: '#ff4d4f',
  }
  return colorMap[level] || '#8c8c8c'
}

export function getWarningLevelText(level: string): string {
  const textMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
  }
  return textMap[level] || level
}
