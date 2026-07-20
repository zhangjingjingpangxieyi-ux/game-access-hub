export const ACCESS_RESPONSIBILITY = {
  '\u5f00\u901a\u6743\u9650': '\u5e73\u53f0',
  '\u6e38\u620f\u63a5\u5165': '\u9879\u76ee\u7ec4',
  '\u5e73\u53f0\u5f00\u53d1': '\u5e73\u53f0',
  '\u6e38\u620f\u63a5\u5165+\u5e73\u53f0\u5f00\u53d1': '\u5e73\u53f0+\u9879\u76ee\u7ec4',
}

export function getAccessResponsibility(accessMethod) {
  return ACCESS_RESPONSIBILITY[(accessMethod || '').trim()] || '-'
}

export function getAccessMethodTone(accessMethod) {
  const method = (accessMethod || '').trim()
  if (method === '\u5f00\u901a\u6743\u9650') return 'green'
  if (method === '\u6e38\u620f\u63a5\u5165') return 'blue'
  if (method === '\u5e73\u53f0\u5f00\u53d1') return 'purple'
  if (method === '\u6e38\u620f\u63a5\u5165+\u5e73\u53f0\u5f00\u53d1') return 'amber'
  return 'gray'
}

export function getMaterialInfo(value) {
  const text = (value || '').trim()
  if (!text || text === '-') return { label: '\u65e0\u9700\u7269\u6599', tone: 'green', detail: '-' }
  return { label: '\u9700\u9879\u76ee\u63d0\u4f9b\u7269\u6599', tone: 'amber', detail: text }
}

export function getPlatformContacts(feature = {}) {
  const dev = (feature.owner_dev || '').trim()
  const qa = (feature.owner_qa || '').trim()
  const parts = []
  if (dev) parts.push(`\u5f00\u53d1\uff1a${dev}`)
  if (qa) parts.push(`\u54c1\u8d28\uff1a${qa}`)
  return { dev, qa, summary: parts.length ? parts.join(' / ') : '-', title: parts.length ? parts.join('\n') : '-' }
}
