(() => {
  const localJson = value => new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json' },
  })
  const nativeFetch = window.fetch.bind(window)

  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input.url
    if (url.startsWith('http://192.168.1.150:10015/')) {
      if (url.includes('queryBigDataConfigData.htm'))
        return Promise.resolve(localJson({ error_code: '0', result: {} }))
      if (url.includes('tuopospeedlist.htm'))
        return Promise.resolve(localJson([]))
      return Promise.resolve(localJson({ error_code: '0', result: [] }))
    }

    if (url.startsWith('http') && !url.startsWith(window.location.origin))
      return Promise.reject(new Error('Network access is disabled in this offline demo.'))

    return nativeFetch(input, init)
  }

  document.documentElement.classList.add('offline-demo')

  const addOfflineMap = container => {
    if (!container || container.querySelector('.offline-map-preview')) return

    const preview = document.createElement('div')
    preview.className = 'offline-map-preview'
    preview.innerHTML = '<div class="offline-map-roads"></div><div class="offline-map-block block-one"></div><div class="offline-map-block block-two"></div><div class="offline-map-pin pin-one"></div><div class="offline-map-pin pin-two"></div><span class="offline-map-label">西安区域示例地图 · 离线模式</span>'
    container.appendChild(preview)
  }

  const map = {
    center: { lng: 108.94236, lat: 34.196633 },
    pitch: 0,
    rotation: 0,
    zoom: 18,
    add() {},
    remove() {},
    getCenter() { return this.center },
    getPitch() { return this.pitch },
    getRotation() { return this.rotation },
    getZoom() { return this.zoom },
    panTo(point) { this.center = point },
    setPitch(value) { this.pitch = value },
    setRotation(value) { this.rotation = value },
    setZoom(value) { this.zoom = value },
  }

  class OfflineMap {
    constructor(container) {
      this.container = typeof container === 'string' ? document.getElementById(container) : container
      this.container.style.position ||= 'relative'
      addOfflineMap(this.container)
      return map
    }
  }

  class OfflineLayer {
    show() {}
    hide() {}
  }
  OfflineLayer.Satellite = OfflineLayer

  class OfflineMarker {
    constructor(options) { this.options = options }
    on() {}
    getPosition() { return this.options.position }
  }

  class OfflineHeatMap {
    setDataSet() {}
    show() {}
    hide() {}
  }

  const offlineAMap = {
    Map: OfflineMap,
    TileLayer: OfflineLayer,
    Marker: OfflineMarker,
    HeatMap: OfflineHeatMap,
    OverlayGroup: class { constructor(items) { this.items = items } },
    Polygon: class { constructor(options) { this.options = options } },
    LngLat: class { constructor(lng, lat) { this.lng = lng; this.lat = lat } },
    Pixel: class { constructor(x, y) { this.x = x; this.y = y } },
    Size: class { constructor(width, height) { this.width = width; this.height = height } },
    Icon: class { constructor(options) { this.options = options } },
    CitySearch: class {
      getLocalCity(callback) { callback('complete', { info: 'OK', city: '西安' }) }
    },
    Weather: class {
      getLive(city, callback) {
        callback(null, {
          city,
          weather: '晴',
          temperature: 22,
          windDirection: '微风',
          windPower: '2级',
          humidity: '35%',
        })
      }
    },
  }

  const amapPlugins = 'AMap.Geolocation,AMap.Weather,AMap.CitySearch,AMap.HeatMap'
  const amapReady = new Promise(resolve => {
    let settled = false
    const finish = api => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      window.AMap = api
      resolve(api)
    }
    const timeout = setTimeout(() => finish(offlineAMap), 3000)
    const script = document.createElement('script')
    script.async = true
    script.onerror = () => finish(offlineAMap)
    script.onload = () => finish(window.AMap || offlineAMap)
    window.__hospitalOfflineAmapReady = () => finish(window.AMap || offlineAMap)
    script.src = `https://webapi.amap.com/maps?key=799333a1fc8927acf44bf731e49327f0&v=2.0&plugin=${amapPlugins}&callback=__hospitalOfflineAmapReady`
    document.head.appendChild(script)
  })

  const nativeInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function (node, referenceNode) {
    if (node?.tagName === 'SCRIPT' && node.src.startsWith('https://webapi.amap.com/maps?')) {
      const callback = new URL(node.src).searchParams.get('callback')
      amapReady.then(api => {
        window.AMap = api
        queueMicrotask(() => window[callback]?.())
      })
      return node
    }

    return nativeInsertBefore.call(this, node, referenceNode)
  }

  const style = document.createElement('style')
  style.textContent = `
    .offline-map-preview { position: absolute; inset: 0; overflow: hidden; background: #dce9df; pointer-events: none; }
    .offline-map-roads { position: absolute; inset: -20%; background: repeating-linear-gradient(28deg, transparent 0 54px, #fff 55px 61px, transparent 62px 116px), repeating-linear-gradient(112deg, transparent 0 76px, #fff 77px 83px, transparent 84px 148px); opacity: .82; }
    .offline-map-block { position: absolute; border: 1px solid #b5ccb8; background: #c6ddc8; transform: rotate(-18deg); }
    .block-one { left: 14%; top: 18%; width: 25%; height: 23%; }
    .block-two { right: 12%; bottom: 16%; width: 31%; height: 25%; }
    .offline-map-pin { position: absolute; width: 14px; height: 14px; border: 3px solid #fff; border-radius: 50% 50% 50% 0; background: #e45f56; box-shadow: 0 1px 5px #52695b; transform: rotate(-45deg); }
    .pin-one { left: 48%; top: 38%; }
    .pin-two { left: 69%; top: 61%; }
    .offline-map-label { position: absolute; left: 12px; bottom: 12px; padding: 5px 8px; color: #30453a; background: rgb(255 255 255 / 88%); font: 12px/1.4 sans-serif; }
    .offline-demo-note { position: fixed; top: 8px; right: 12px; z-index: 10000; padding: 5px 8px; color: #fff; background: rgb(20 43 57 / 82%); border-radius: 3px; font: 11px/1.4 sans-serif; pointer-events: none; }
    .offline-demo .camera { position: relative; }
    .offline-demo .camera.offline-video::after { content: "离线演示 · 实时视频需内网服务"; position: absolute; left: 0; right: 0; top: 45%; color: #fff; text-align: center; font: 11px/1.4 sans-serif; text-shadow: 0 1px 3px #000; pointer-events: none; }
    .offline-demo .camera__video--loading { background-image: none !important; }
  `
  document.head.appendChild(style)

  const note = document.createElement('div')
  note.className = 'offline-demo-note'
  note.textContent = '地图加载中 · 图表数据为本地示例'
  amapReady.then(api => {
    note.textContent = api === offlineAMap
      ? '离线演示 · 地图、图表、天气为本地示例'
      : '高德地图在线 · 图表数据为本地示例'
  })
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(note), { once: true })

  const markOfflineVideos = () => {
    document.querySelectorAll('video.camera__video').forEach(video => {
      video.closest('.camera')?.classList.add('offline-video')
    })
  }
  new MutationObserver(markOfflineVideos).observe(document.documentElement, { childList: true, subtree: true })
  markOfflineVideos()
})()
