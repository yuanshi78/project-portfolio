(() => {
  const storagePrefix = 'topo-tool-offline-v1:'
  const defaultProjectId = 'fortesting'
  const starterRows = [
    { no: 1, name: '核心交换机', ip: '10.0.0.1', type: 'switch', linksto: '2,3,4', position: { x: 760, y: 120 } },
    { no: 2, name: '出口防火墙', ip: '10.0.0.2', type: 'firewall', linksto: '5', position: { x: 500, y: 300 } },
    { no: 3, name: '业务服务器', ip: '10.0.0.3', type: 'server', linksto: '6', position: { x: 760, y: 300 } },
    { no: 4, name: '门禁交换机', ip: '10.0.0.4', type: 'switch', linksto: '7', position: { x: 1020, y: 300 } },
    { no: 5, name: '外网出口', type: 'cloud', position: { x: 500, y: 500 } },
    { no: 6, name: '视频管理平台', ip: '10.0.0.6', type: 'server', position: { x: 760, y: 500 } },
    { no: 7, name: '摄像机', ip: '10.0.0.7', type: 'camera-qx', position: { x: 1020, y: 500 } },
  ]

  const initialRecords = () => [{
    id: 1,
    projectId: defaultProjectId,
    name: '园区网络拓扑（离线示例）',
    ismain: 'true',
    parentTopoId: null,
    linkedNodeId: null,
    dataStr: JSON.stringify(starterRows),
  }]

  const readRecords = projectId => {
    try {
      const records = JSON.parse(localStorage.getItem(storagePrefix + projectId))
      return Array.isArray(records) ? records : initialRecords()
    }
    catch {
      return initialRecords()
    }
  }

  const writeRecords = (projectId, records) => {
    localStorage.setItem(storagePrefix + projectId, JSON.stringify(records))
  }

  const response = payload => new Response(JSON.stringify(payload), {
    headers: { 'content-type': 'application/json' },
  })

  const parseBody = async init => {
    if (!init?.body) return {}
    try { return JSON.parse(init.body) }
    catch { return {} }
  }

  const ok = result => ({ error_code: '0', result })

  const nativeFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url, window.location.href)
    const isOfflineApi = url.pathname.startsWith('/equipment/')
      && (url.hostname === '192.168.40.32' || url.hostname === '192.168.1.124')

    if (!isOfflineApi) {
      if (url.origin !== window.location.origin)
        return Promise.reject(new Error('Network access is disabled in this offline demo.'))
      return nativeFetch(input, init)
    }

    const body = await parseBody(init)
    const projectId = body.projectId || defaultProjectId
    const records = readRecords(projectId)
    const endpoint = url.pathname.split('/').pop()

    if (endpoint === 'queryTuopuDefineList.htm')
      return response(ok(records))

    if (endpoint === 'addTuopuDefine.htm') {
      const id = records.reduce((max, record) => Math.max(max, Number(record.id) || 0), 0) + 1
      if (body.ismain === 'true') records.forEach(record => { record.ismain = 'false' })
      records.push({
        id,
        projectId,
        name: body.name || '新建拓扑图',
        ismain: body.ismain || 'false',
        parentTopoId: body.parentTopoId || null,
        linkedNodeId: body.linkedNodeId || null,
        dataStr: '',
      })
      writeRecords(projectId, records)
      return response(ok(JSON.stringify({ msg: id })))
    }

    if (endpoint === 'editTuopuDefine.htm') {
      const record = records.find(item => String(item.id) === String(body.id))
      if (record) {
        Object.assign(record, body)
        if (body.ismain === 'true') records.forEach(item => { if (item !== record) item.ismain = 'false' })
      }
      writeRecords(projectId, records)
      return response(ok({}))
    }

    if (endpoint === 'deleteTuopuDefine.htm') {
      writeRecords(projectId, records.filter(item => String(item.id) !== String(body.id)))
      return response(ok({}))
    }

    if (endpoint === 'saveTuopuDefine.htm' || endpoint === 'saveTuopuDisplay.htm') {
      const record = records.find(item => String(item.id) === String(body.id))
      if (record && body.dataStr !== undefined) record.dataStr = body.dataStr
      writeRecords(projectId, records)
      return response(ok({}))
    }

    if (endpoint === 'clearAllTuopuDefineAndDisplay.htm') {
      writeRecords(projectId, [])
      return response(ok({}))
    }

    if (endpoint === 'addMoreTuopuDefine.htm') {
      const ids = []
      for (const item of body.topoData || []) {
        const id = records.reduce((max, record) => Math.max(max, Number(record.id) || 0), 0) + 1
        records.push({ ...item, id, projectId, dataStr: '' })
        ids.push(id)
      }
      writeRecords(projectId, records)
      return response(ok(JSON.stringify({ msg: ids.join(',') })))
    }

    return response(ok([]))
  }

  const note = document.createElement('div')
  note.className = 'offline-storage-note'
  note.textContent = '离线模式 · 拓扑保存在此浏览器'
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(note), { once: true })

  const style = document.createElement('style')
  style.textContent = '.offline-storage-note{position:fixed;right:12px;bottom:10px;z-index:9999;padding:6px 10px;border-radius:4px;background:#173f36;color:#fff;font:12px/1.4 sans-serif;box-shadow:0 2px 8px #0003;pointer-events:none}'
  document.head.appendChild(style)
})()
