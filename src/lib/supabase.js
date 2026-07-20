const baseUrl = import.meta.env.VITE_GLACIER_BAAS_BASE_URL || 'https://chat.q1.com/baas'
const appKey = import.meta.env.VITE_GLACIER_BAAS_APP_KEY

window.GLACIER_SSO_ENDPOINT = import.meta.env.VITE_GLACIER_SSO_ENDPOINT || 'https://chat.q1.com/api/glacier/sso/assertion'
window.GLACIER_LOGIN_URL = import.meta.env.VITE_GLACIER_LOGIN_URL || 'https://chat.q1.com/login'

if (!window.GlacierBaaS) throw new Error('Glacier BaaS SDK \u672a\u52a0\u8f7d')
if (!appKey) throw new Error('\u7f3a\u5c11 VITE_GLACIER_BAAS_APP_KEY \u914d\u7f6e')

export const baas = window.GlacierBaaS.init({ appKey, baseUrl })

const RELATIONS = {
  features: { stages: { collection: 'stages', foreignKey: 'stage_id' } },
  project_features: { features: { collection: 'features', foreignKey: 'feature_id' } },
}

let stageMapPromise = null

function normalizeDoc(doc) {
  if (!doc) return doc
  if (doc.data && typeof doc.data === 'object') {
    return { ...doc.data, id: doc.id, _meta: { owner: doc.owner_end_user_id, acl: doc.acl } }
  }
  return { ...doc, id: doc.id || doc._id }
}

async function getStageMap() {
  if (!stageMapPromise) {
    stageMapPromise = baas.collection('stages').where({}).limit(100).find().then(rawRows => {
      const rows = rawRows.map(normalizeDoc)
      const rawToLegacy = new Map()
      const legacyToRaw = new Map()
      const byLegacy = new Map()
      for (const row of rows) {
        const legacyId = Number(row.stage_num) + 1
        rawToLegacy.set(String(row.id), legacyId)
        legacyToRaw.set(String(legacyId), row.id)
        byLegacy.set(String(legacyId), { ...row, _raw_id: row.id, id: legacyId })
      }
      return { rawToLegacy, legacyToRaw, byLegacy }
    })
  }
  return stageMapPromise
}

async function normalizeStageFields(collectionName, rows) {
  if (collectionName === 'stages') {
    const map = await getStageMap()
    return rows.map(row => map.byLegacy.get(String(Number(row.stage_num) + 1)) || row)
  }

  if (!rows.some(row => row && Object.prototype.hasOwnProperty.call(row, 'stage_id'))) return rows

  const map = await getStageMap()
  return rows.map(row => {
    if (!row || !Object.prototype.hasOwnProperty.call(row, 'stage_id')) return row
    const legacyStageId = map.rawToLegacy.get(String(row.stage_id)) ?? row.stage_id
    return { ...row, _raw_stage_id: row.stage_id, stage_id: legacyStageId }
  })
}

async function preparePayloadForWrite(payload) {
  if (Array.isArray(payload)) return Promise.all(payload.map(preparePayloadForWrite))
  if (!payload || typeof payload !== 'object' || !Object.prototype.hasOwnProperty.call(payload, 'stage_id')) return payload
  const map = await getStageMap()
  const rawStageId = map.legacyToRaw.get(String(payload.stage_id)) ?? payload.stage_id
  return { ...payload, stage_id: rawStageId }
}

function parseRelations(selection = '*') {
  const relations = []
  const pattern = /([a-zA-Z_][\w]*)\(([^)]*)\)/g
  let match
  while ((match = pattern.exec(selection))) relations.push({ name: match[1], fields: match[2] })
  return relations
}

function projectFields(row, selection) {
  if (!row || !selection || selection === '*' || selection.includes('(')) return row
  const fields = selection.split(',').map(field => field.trim()).filter(Boolean)
  return Object.fromEntries(fields.map(field => [field, row[field]]))
}

function compareValues(a, b, { ascending = true, nullsFirst = true } = {}) {
  const aEmpty = a === null || a === undefined
  const bEmpty = b === null || b === undefined
  if (aEmpty && bEmpty) return 0
  if (aEmpty) return nullsFirst ? -1 : 1
  if (bEmpty) return nullsFirst ? 1 : -1
  if (a === b) return 0
  const result = a > b ? 1 : -1
  return ascending ? result : -result
}

async function getRawRelationId(collectionName, foreignKey, value) {
  if ((collectionName === 'features' || collectionName === 'projects') && foreignKey === 'stage_id') {
    const map = await getStageMap()
    return map.legacyToRaw.get(String(value)) ?? value
  }
  return value
}

async function hydrateRelations(collectionName, rows, selection) {
  let result = rows
  for (const relation of parseRelations(selection)) {
    const config = RELATIONS[collectionName]?.[relation.name]
    if (!config) continue
    const rawIds = await Promise.all(
      result.map(row => row[config.foreignKey]).filter(Boolean).map(id => getRawRelationId(collectionName, config.foreignKey, id)),
    )
    const ids = [...new Set(rawIds.filter(Boolean))]
    if (!ids.length) continue
    const relatedRows = await Promise.all(ids.map(id => baas.collection(config.collection).get(id)))
    let normalizedRelatedRows = relatedRows.filter(Boolean).map(normalizeDoc)
    normalizedRelatedRows = await normalizeStageFields(config.collection, normalizedRelatedRows)
    const byId = new Map(
      normalizedRelatedRows.map(row => [String(row._raw_id || row.id), projectFields(row, relation.fields)]),
    )
    result = await Promise.all(result.map(async row => {
      const rawId = await getRawRelationId(collectionName, config.foreignKey, row[config.foreignKey])
      return { ...row, [relation.name]: byId.get(String(rawId)) || null }
    }))
  }
  return result
}

class QueryBuilder {
  constructor(collectionName) {
    this.collectionName = collectionName
    this.selection = '*'
    this.filters = {}
    this.inFilters = []
    this.orderBys = []
    this.limitValue = null
    this.singleValue = false
    this.operation = 'select'
    this.payload = null
  }

  select(selection = '*') {
    this.selection = selection
    return this
  }

  eq(field, value) {
    this.filters[field] = value
    return this
  }

  in(field, values) {
    this.inFilters.push({ field, values: values || [] })
    return this
  }

  order(field, options = {}) {
    this.orderBys.push({
      field,
      ascending: options.ascending !== false,
      nullsFirst: options.nullsFirst !== false,
    })
    return this
  }

  limit(value) {
    this.limitValue = value
    return this
  }

  single() {
    this.singleValue = true
    return this
  }

  insert(payload) {
    this.operation = 'insert'
    this.payload = payload
    return this
  }

  update(payload) {
    this.operation = 'update'
    this.payload = payload
    return this
  }

  delete() {
    this.operation = 'delete'
    return this
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject)
  }

  async prepareFilters() {
    if (!Object.prototype.hasOwnProperty.call(this.filters, 'stage_id')) return this.filters
    const map = await getStageMap()
    return { ...this.filters, stage_id: map.legacyToRaw.get(String(this.filters.stage_id)) ?? this.filters.stage_id }
  }

  applyInFilters(rows) {
    if (!this.inFilters.length) return rows
    return rows.filter(row => this.inFilters.every(({ field, values }) => values.map(String).includes(String(row[field]))))
  }

  applyOrdering(rows) {
    if (!this.orderBys.length) return rows
    return [...rows].sort((a, b) => {
      for (const orderBy of this.orderBys) {
        const result = compareValues(a[orderBy.field], b[orderBy.field], orderBy)
        if (result !== 0) return result
      }
      return 0
    })
  }

  async findRows() {
    const filters = await this.prepareFilters()
    if (filters.id) {
      const { id, ...otherFilters } = filters
      const raw = await baas.collection(this.collectionName).get(id)
      if (!raw) return []
      let row = normalizeDoc(raw)
      ;[row] = await normalizeStageFields(this.collectionName, [row])
      const matches = Object.entries(otherFilters).every(([field, value]) => row[field] === value)
      return matches ? this.applyInFilters([row]) : []
    }

    let query = baas.collection(this.collectionName).where(filters)
    query = query.limit(500)
    let rows = (await query.find()).map(normalizeDoc)
    rows = await normalizeStageFields(this.collectionName, rows)
    rows = this.applyInFilters(rows)
    rows = this.applyOrdering(rows)
    if (this.limitValue) rows = rows.slice(0, this.limitValue)
    return rows
  }

  async execute() {
    try {
      if (this.operation === 'insert') return await this.executeInsert()
      if (this.operation === 'update') return await this.executeUpdate()
      if (this.operation === 'delete') return await this.executeDelete()
      let rows = await this.findRows()
      rows = await hydrateRelations(this.collectionName, rows, this.selection)
      rows = rows.map(row => projectFields(row, this.selection))
      return { data: this.singleValue ? (rows[0] || null) : rows, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async executeInsert() {
    const payloads = Array.isArray(this.payload) ? this.payload : [this.payload]
    const created = []
    for (const payload of payloads) {
      const writePayload = await preparePayloadForWrite(payload)
      let row = normalizeDoc(await baas.collection(this.collectionName).create(writePayload))
      ;[row] = await normalizeStageFields(this.collectionName, [row])
      created.push(row)
    }
    return { data: this.singleValue ? (created[0] || null) : created, error: null }
  }

  async executeUpdate() {
    const rows = await this.findRows()
    const writePayload = await preparePayloadForWrite(this.payload)
    const updated = []
    for (const row of rows) {
      let updatedRow = normalizeDoc(await baas.collection(this.collectionName).update(row.id, writePayload))
      ;[updatedRow] = await normalizeStageFields(this.collectionName, [updatedRow])
      updated.push(updatedRow)
    }
    return { data: this.singleValue ? (updated[0] || null) : updated, error: null }
  }

  async executeDelete() {
    const rows = await this.findRows()
    for (const row of rows) await baas.collection(this.collectionName).remove(row.id)
    return { data: rows, error: null }
  }
}

export const supabase = {
  from(collectionName) {
    return new QueryBuilder(collectionName)
  },
}
