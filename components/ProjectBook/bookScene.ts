import * as THREE from "three"

export interface BookProject {
  id: number
  title: string
  description: string
  tags: string[]
  url?: string | null
  image_url?: string | null
  image_alt?: string | null
  year: number
  status: "live" | "wip" | "concept"
}

export interface ZoomPayload {
  eyebrow: string
  title: string
  body: string
  tags: string[]
  year: number
  status: string
  url: string | null
  imageUrl: string | null
}

export interface PageInfo {
  page: number
  total: number
  label: string
}

export interface BookSceneHandle {
  destroy(): void
  closeZoom(): void
}

interface CreateBookOptions {
  canvas: HTMLCanvasElement
  projects: BookProject[]
  onZoomChange?: (zoom: ZoomPayload | null) => void
  onPageChange?: (info: PageInfo) => void
}

interface CoverMeta { kind: "cover" }
interface BackMeta { kind: "back" }
interface ImageMeta { kind: "image"; projectIdx: number }
interface TextMeta { kind: "text"; projectIdx: number }
type PageMeta = CoverMeta | BackMeta | ImageMeta | TextMeta

interface LeafSpec {
  frontTex: THREE.CanvasTexture
  backTex: THREE.CanvasTexture
  frontMeta: PageMeta
  backMeta: PageMeta
}

interface Leaf {
  number: number
  spec: LeafSpec
  group: THREE.Group
  mesh: THREE.SkinnedMesh
  skeleton: THREE.Skeleton
  bones: THREE.Bone[]
  turnedAt: number
  lastOpened: boolean
  highlighted: boolean
}

// ── Skinning constants (verbatim from the original Book.jsx port) ──
const easingFactor = 0.5
const easingFactorFold = 0.3
const insideCurveStrength = 0.18
const outsideCurveStrength = 0.05
const turningCurveStrength = 0.09

const PAGE_WIDTH = 1.28
const PAGE_HEIGHT = 1.71
const PAGE_DEPTH = 0.003
const PAGE_SEGMENTS = 30
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS

const TEX_W = 1024
const TEX_H = 1366
const BRAND = "#644BFF"

// ── Asset loading ─────────────────────────────────────────────────
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

// ── Canvas texture helpers ────────────────────────────────────────
function makeTex(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function drawPaperBg(ctx: CanvasRenderingContext2D, w: number, h: number, spineOnRight: boolean) {
  ctx.fillStyle = "#f7f1e3"
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 0.05
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = Math.random() > 0.55 ? "#7a6336" : "#1c1408"
    const sz = Math.random() * 1.6
    ctx.fillRect(Math.random() * w, Math.random() * h, sz, sz)
  }
  ctx.globalAlpha = 1
  const spineX = spineOnRight ? w : 0
  const grad = ctx.createLinearGradient(spineX, 0, spineOnRight ? w - 140 : 140, 0)
  grad.addColorStop(0, "rgba(60,40,15,0.20)")
  grad.addColorStop(1, "rgba(60,40,15,0)")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

function drawLinen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#1a1714"
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 0.04
  for (let y = 0; y < h; y += 3) { ctx.fillStyle = "#fff"; ctx.fillRect(0, y, w, 1) }
  for (let x = 0; x < w; x += 4) { ctx.fillStyle = "#000"; ctx.fillRect(x, 0, 1, h) }
  ctx.globalAlpha = 0.08
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "#fff" : "#000"
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5)
  }
  ctx.globalAlpha = 1
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const test = current ? current + " " + word : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y)
}

// ── Page texture factories ────────────────────────────────────────
function makeFrontCover(logo: HTMLImageElement | null): THREE.CanvasTexture {
  const c = document.createElement("canvas")
  c.width = TEX_W; c.height = TEX_H
  const ctx = c.getContext("2d")!
  const w = c.width, h = c.height
  drawLinen(ctx, w, h)

  ctx.strokeStyle = BRAND
  ctx.fillStyle = BRAND
  ctx.lineWidth = 2
  ctx.strokeRect(140, 200, w - 280, h - 400)
  ctx.lineWidth = 1
  ctx.strokeRect(168, 228, w - 336, h - 456)

  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = '500 28px "Inter", sans-serif'
  ctx.fillText("—  P R O J E C T S  —", w / 2, 340)

  if (logo) {
    const logoSize = 150
    ctx.drawImage(logo, (w - logoSize) / 2, h / 2 - 280, logoSize, logoSize)
  }

  ctx.fillStyle = BRAND
  ctx.font = '500 140px "Inter", sans-serif'
  ctx.fillText("Pokyh", w / 2, h / 2 - 30)

  const cx = w / 2, cy = h / 2 + 80
  ctx.strokeStyle = BRAND
  ctx.beginPath()
  ctx.moveTo(cx - 60, cy); ctx.lineTo(cx + 60, cy)
  ctx.moveTo(cx - 8, cy - 8); ctx.lineTo(cx, cy); ctx.lineTo(cx + 8, cy - 8)
  ctx.moveTo(cx - 8, cy + 8); ctx.lineTo(cx, cy); ctx.lineTo(cx + 8, cy + 8)
  ctx.lineWidth = 1.5; ctx.stroke()

  ctx.font = '500 22px "Inter", sans-serif'
  ctx.fillText("A    C O L L E C T I O N", w / 2, h / 2 + 170)
  ctx.font = '500 26px "Inter", sans-serif'
  ctx.fillText("by Pokyh Labs", w / 2, h - 280)

  return makeTex(c)
}

function makeBackCover(logo: HTMLImageElement | null): THREE.CanvasTexture {
  const c = document.createElement("canvas")
  c.width = TEX_W; c.height = TEX_H
  const ctx = c.getContext("2d")!
  const w = c.width, h = c.height
  drawLinen(ctx, w, h)

  if (logo) {
    const logoSize = 130
    ctx.drawImage(logo, (w - logoSize) / 2, h / 2 - 200, logoSize, logoSize)
  }
  ctx.fillStyle = BRAND
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = '300 86px "Inter", sans-serif'
  ctx.fillText("hope you liked it.", w / 2, h / 2 + 20)

  ctx.strokeStyle = BRAND; ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(w / 2 - 50, h / 2 + 110); ctx.lineTo(w / 2 + 50, h / 2 + 110); ctx.stroke()

  ctx.font = '500 22px "Inter", sans-serif'
  ctx.fillText("—  P O K Y H  —", w / 2, h / 2 + 160)
  ctx.font = '300 44px "Inter", sans-serif'
  ctx.fillText("Emanuel & Felix", w / 2, h - 240)

  return makeTex(c)
}

function makeImagePage(project: BookProject, projectIdx: number, total: number, img: HTMLImageElement | null): THREE.CanvasTexture {
  const c = document.createElement("canvas")
  c.width = TEX_W; c.height = TEX_H
  const ctx = c.getContext("2d")!
  const w = c.width, h = c.height
  drawPaperBg(ctx, w, h, false)

  // Top eyebrow + rule
  ctx.strokeStyle = "rgba(20,15,8,0.35)"; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(120, 140); ctx.lineTo(w - 120, 140); ctx.stroke()
  ctx.fillStyle = "rgba(20,15,8,0.55)"
  ctx.font = '500 22px "Inter", sans-serif'
  ctx.textAlign = "left"; ctx.textBaseline = "top"
  ctx.fillText("PROJECT", 120, 170)
  ctx.textAlign = "right"
  ctx.fillText(`${String(projectIdx + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, w - 120, 170)

  // Image frame
  const pad = 120
  const imgX = pad, imgY = 240
  const imgW = w - pad * 2
  const imgH = h - imgY - 260

  if (img) {
    // cover-fit
    const ir = img.width / img.height
    const fr = imgW / imgH
    let sx = 0, sy = 0, sw = img.width, sh = img.height
    if (ir > fr) { sw = img.height * fr; sx = (img.width - sw) / 2 }
    else { sh = img.width / fr; sy = (img.height - sh) / 2 }
    ctx.save()
    ctx.beginPath()
    ctx.rect(imgX, imgY, imgW, imgH)
    ctx.clip()
    ctx.drawImage(img, sx, sy, sw, sh, imgX, imgY, imgW, imgH)
    ctx.restore()
  } else {
    // Placeholder
    ctx.fillStyle = BRAND
    ctx.globalAlpha = 0.12
    ctx.fillRect(imgX, imgY, imgW, imgH)
    ctx.globalAlpha = 1
    ctx.fillStyle = BRAND
    ctx.font = '700 72px "Inter", sans-serif'
    ctx.textAlign = "center"; ctx.textBaseline = "middle"
    ctx.fillText(project.title, imgX + imgW / 2, imgY + imgH / 2)
  }

  // Hairline frame around image
  ctx.strokeStyle = "rgba(20,15,8,0.25)"
  ctx.lineWidth = 1
  ctx.strokeRect(imgX + 0.5, imgY + 0.5, imgW - 1, imgH - 1)

  // Folio
  ctx.fillStyle = "rgba(20,15,8,0.5)"
  ctx.font = '400 28px "Inter", sans-serif'
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"
  ctx.fillText(`— ${project.year} —`, w / 2, h - 100)

  return makeTex(c)
}

// Button bounds on the text page canvas (used for UV click detection in onClick).
// Canvas coords → UV: uv.x = canvasX/TEX_W, uv.y = 1 - canvasY/TEX_H (flipY=true).
// These values are intentionally generous to account for font measurement variance.
export const TEXT_PAGE_BTN_UV = { xMin: 0.57, xMax: 0.93, yMin: 0.09, yMax: 0.16 }

function makeTextPage(project: BookProject, projectIdx: number, total: number): THREE.CanvasTexture {
  const c = document.createElement("canvas")
  c.width = TEX_W; c.height = TEX_H
  const ctx = c.getContext("2d")!
  const w = c.width, h = c.height
  drawPaperBg(ctx, w, h, false)

  // Header rule + labels
  ctx.strokeStyle = "rgba(20,15,8,0.35)"; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(120, 140); ctx.lineTo(w - 120, 140); ctx.stroke()
  ctx.fillStyle = "rgba(20,15,8,0.55)"
  ctx.font = '500 22px "Inter", sans-serif'
  ctx.textAlign = "left"; ctx.textBaseline = "top"
  ctx.fillText("CHAPTER", 120, 170)
  ctx.textAlign = "right"
  ctx.fillText(String(projectIdx + 1).padStart(2, "0"), w - 120, 170)

  // Title
  ctx.fillStyle = "#15110a"
  ctx.textAlign = "left"; ctx.textBaseline = "top"
  ctx.font = '700 96px "Inter", sans-serif'
  const titleLines = wrapText(ctx, project.title, w - 240)
  let y = 260
  for (const line of titleLines.slice(0, 3)) {
    ctx.fillText(line, 120, y)
    y += 108
  }

  // Rule
  ctx.strokeStyle = "rgba(20,15,8,0.4)"; ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(120, y + 20); ctx.lineTo(240, y + 20); ctx.stroke()
  y += 70

  // Description
  ctx.fillStyle = "rgba(20,15,8,0.78)"
  ctx.font = '400 36px "Inter", sans-serif'
  const descLines = wrapText(ctx, project.description, w - 240)
  for (const line of descLines.slice(0, 9)) {
    ctx.fillText(line, 120, y)
    y += 52
  }

  // Tags
  let tagX = 120
  let tagY = h - 390
  ctx.font = '500 22px "Inter", sans-serif'
  for (const tag of project.tags.slice(0, 8)) {
    const tw = ctx.measureText(tag).width + 36
    if (tagX + tw > w - 120) { tagX = 120; tagY += 52 }
    ctx.strokeStyle = "rgba(20,15,8,0.35)"; ctx.lineWidth = 1
    roundRect(ctx, tagX, tagY, tw, 38, 19)
    ctx.stroke()
    ctx.fillStyle = "rgba(20,15,8,0.7)"
    ctx.textBaseline = "middle"
    ctx.textAlign = "left"
    ctx.fillText(tag, tagX + 18, tagY + 20)
    tagX += tw + 12
  }

  // Footer: year · status (left)
  ctx.fillStyle = "rgba(20,15,8,0.55)"
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"
  ctx.font = '500 20px "Inter", sans-serif'
  ctx.fillText(`${project.year}   ·   ${project.status.toUpperCase()}`, 120, h - 155)

  // VIEW PROJECT pill button (right-aligned, bottom)
  if (project.url) {
    const btnLabel = "VIEW PROJECT  ↗"
    ctx.font = '600 22px "Inter", sans-serif'
    const textW = ctx.measureText(btnLabel).width
    const padX = 34
    const btnH = 54
    const btnW = textW + padX * 2
    const btnRight = w - 96
    const btnLeft = btnRight - btnW
    const btnCY = h - 170

    ctx.fillStyle = BRAND
    roundRect(ctx, btnLeft, btnCY - btnH / 2, btnW, btnH, 27)
    ctx.fill()

    ctx.fillStyle = "#fff"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(btnLabel, btnLeft + btnW / 2, btnCY)
  }

  // Folio
  ctx.fillStyle = "rgba(20,15,8,0.5)"
  ctx.font = '400 28px "Inter", sans-serif'
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"
  ctx.fillText(`— ${String(projectIdx + 1).padStart(2, "0")} —`, w / 2, h - 96)

  return makeTex(c)
}

// ── Public factory ────────────────────────────────────────────────
export async function createBookScene({
  canvas, projects, onZoomChange, onPageChange,
}: CreateBookOptions): Promise<BookSceneHandle> {
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('300 44px "Inter"'),
        document.fonts.load('400 28px "Inter"'),
        document.fonts.load('500 22px "Inter"'),
        document.fonts.load('500 140px "Inter"'),
        document.fonts.load('600 22px "Inter"'),
        document.fonts.load('700 72px "Inter"'),
        document.fonts.load('700 96px "Inter"'),
      ])
      await document.fonts.ready
    } catch {}
  }

  const N = projects.length
  const [logo, ...projectImages] = await Promise.all([
    loadImage("/book-logo.png"),
    ...projects.map((p) => (p.image_url ? loadImage(p.image_url) : Promise.resolve(null))),
  ])

  // Build leaf specs: cover/back wrap project pairs.
  // leaf 0:   front=cover,       back=image_0
  // leaf k:   front=text_(k-1),  back=image_k          (1 <= k <= N-1)
  // leaf N:   front=text_(N-1),  back=back-cover
  // When N === 0 we only have one leaf with cover+back-cover.
  const leafSpecs: LeafSpec[] = []
  if (N === 0) {
    leafSpecs.push({
      frontTex: makeFrontCover(logo),
      backTex: makeBackCover(logo),
      frontMeta: { kind: "cover" },
      backMeta: { kind: "back" },
    })
  } else {
    for (let k = 0; k <= N; k++) {
      const frontMeta: PageMeta = k === 0 ? { kind: "cover" } : { kind: "text", projectIdx: k - 1 }
      const backMeta: PageMeta = k === N ? { kind: "back" } : { kind: "image", projectIdx: k }
      const frontTex = frontMeta.kind === "cover"
        ? makeFrontCover(logo)
        : makeTextPage(projects[frontMeta.projectIdx], frontMeta.projectIdx, N)
      const backTex = backMeta.kind === "back"
        ? makeBackCover(logo)
        : makeImagePage(projects[backMeta.projectIdx], backMeta.projectIdx, N, projectImages[backMeta.projectIdx] ?? null)
      leafSpecs.push({ frontTex, backTex, frontMeta, backMeta })
    }
  }

  const TOTAL = leafSpecs.length
  const MAX_PAGE = TOTAL

  // Shared bone-skinned geometry
  const pageGeometry = new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH, PAGE_SEGMENTS, 2)
  pageGeometry.translate(PAGE_WIDTH / 2, 0, 0)
  {
    const position = pageGeometry.attributes.position
    const vertex = new THREE.Vector3()
    const skinIndexes: number[] = []
    const skinWeights: number[] = []
    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i)
      const x = vertex.x
      const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH))
      const skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH
      skinIndexes.push(skinIndex, skinIndex + 1, 0, 0)
      skinWeights.push(1 - skinWeight, skinWeight, 0, 0)
    }
    pageGeometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndexes, 4))
    pageGeometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4))
  }

  const whiteColor = new THREE.Color("white")
  const emissiveColor = new THREE.Color(BRAND)
  const HOVER_EMISSIVE = 0.06

  function createLeaf(number: number, spec: LeafSpec): Leaf {
    const materials = [
      new THREE.MeshStandardMaterial({ color: whiteColor }),
      new THREE.MeshStandardMaterial({ color: 0x111111 }),
      new THREE.MeshStandardMaterial({ color: whiteColor }),
      new THREE.MeshStandardMaterial({ color: whiteColor }),
      new THREE.MeshStandardMaterial({ color: whiteColor, map: spec.frontTex, roughness: 0.55, emissive: emissiveColor, emissiveIntensity: 0 }),
      new THREE.MeshStandardMaterial({ color: whiteColor, map: spec.backTex, roughness: 0.55, emissive: emissiveColor, emissiveIntensity: 0 }),
    ]
    const bones: THREE.Bone[] = []
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      const bone = new THREE.Bone()
      bones.push(bone)
      bone.position.x = i === 0 ? 0 : SEGMENT_WIDTH
      if (i > 0) bones[i - 1].add(bone)
    }
    const skeleton = new THREE.Skeleton(bones)
    const mesh = new THREE.SkinnedMesh(pageGeometry, materials)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    mesh.add(skeleton.bones[0])
    mesh.bind(skeleton)
    const group = new THREE.Group()
    group.add(mesh)
    group.rotation.y = Math.PI / 2 // start closed
    return { number, spec, group, mesh, skeleton, bones, turnedAt: 0, lastOpened: false, highlighted: false }
  }

  // Renderer & scene
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  scene.background = null

  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100)
  const OVERVIEW_POS = new THREE.Vector3(0, 0.1, 4.0)
  const COVER_LOOK = new THREE.Vector3(0, 0, 0)
  const OPEN_LOOK = new THREE.Vector3(0, 0, 0)
  const overviewLookFor = (p: number) => (p === 0 ? COVER_LOOK : OPEN_LOOK)

  camera.position.copy(OVERVIEW_POS); camera.lookAt(overviewLookFor(0))

  const targetPos = OVERVIEW_POS.clone()
  const targetLook = overviewLookFor(0).clone()
  const currentLook = overviewLookFor(0).clone()

  scene.add(new THREE.AmbientLight(0xffffff, 0.7))
  const key = new THREE.DirectionalLight(0xffffff, 2.0)
  key.position.set(2, 5, 2)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.left = -3; key.shadow.camera.right = 3
  key.shadow.camera.top = 3; key.shadow.camera.bottom = -3
  key.shadow.camera.near = 0.1; key.shadow.camera.far = 12
  key.shadow.bias = -0.0001; key.shadow.radius = 4
  scene.add(key)
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.55); fillLight.position.set(-3, 2, -1); scene.add(fillLight)
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.35); rimLight.position.set(0, 2, -3); scene.add(rimLight)

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: 0.18 }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -1.5
  ground.receiveShadow = true
  scene.add(ground)

  const tiltGroup = new THREE.Group()
  tiltGroup.rotation.x = -Math.PI / 12
  tiltGroup.position.x = 0.3
  scene.add(tiltGroup)
  const bookGroup = new THREE.Group()
  bookGroup.rotation.y = -Math.PI / 2
  tiltGroup.add(bookGroup)

  const leaves: Leaf[] = leafSpecs.map((spec, i) => {
    const leaf = createLeaf(i, spec)
    bookGroup.add(leaf.group)
    return leaf
  })

  // ── State ────────────────────────────────────────────────────────
  let page = 0
  let delayedPage = 0
  let pageStepTimer: ReturnType<typeof setTimeout> | null = null
  let zoomedProject: number | null = null

  function spreadLabel(p: number): string {
    if (N === 0) return p === 0 ? "Cover" : "Back Cover"
    if (p === 0) return "Cover"
    if (p === MAX_PAGE) return "Back Cover"
    return `Project ${String(p).padStart(2, "0")} / ${String(N).padStart(2, "0")}`
  }

  function publishPageChange() {
    onPageChange?.({ page, total: MAX_PAGE, label: spreadLabel(page) })
  }

  function setPage(next: number) {
    if (next < 0 || next > MAX_PAGE) return
    if (next === page) return
    for (const lf of leaves) lf.highlighted = false
    canvas.style.cursor = "default"
    page = next
    if (zoomedProject === null) targetLook.copy(overviewLookFor(page))
    try {
      const a = new Audio("/page-flip.mp3")
      a.volume = 0.45
      a.play().catch(() => {})
    } catch {}
    stepDelayedPage()
    publishPageChange()
  }

  function stepDelayedPage() {
    if (pageStepTimer) clearTimeout(pageStepTimer)
    const go = () => {
      if (page === delayedPage) return
      const gap = Math.abs(page - delayedPage)
      if (page > delayedPage) delayedPage += 1
      else delayedPage -= 1
      pageStepTimer = setTimeout(go, gap > 2 ? 50 : 150)
    }
    go()
  }

  // ── Input ────────────────────────────────────────────────────────
  let scrollAccum = 0
  const SCROLL_THRESHOLD = 80

  function canFlip(dir: number): boolean {
    if (dir > 0) return page < MAX_PAGE
    if (dir < 0) return page > 0
    return false
  }

  const onWheel = (e: WheelEvent) => {
    if (zoomedProject !== null) return
    const dir = e.deltaY > 0 ? 1 : -1
    if (!canFlip(dir)) {
      // At boundary — let the page scroll naturally.
      scrollAccum = 0
      return
    }
    e.preventDefault()
    scrollAccum += e.deltaY
    if (Math.abs(scrollAccum) >= SCROLL_THRESHOLD) {
      const d = scrollAccum > 0 ? 1 : -1
      scrollAccum = 0
      if (canFlip(d)) setPage(page + d)
    }
  }

  let lastTouchY: number | null = null
  const onTouchStart = (e: TouchEvent) => { if (e.touches.length) lastTouchY = e.touches[0].clientY }
  const onTouchMove = (e: TouchEvent) => {
    if (zoomedProject !== null) return
    if (!e.touches.length || lastTouchY == null) return
    const y = e.touches[0].clientY
    const delta = (lastTouchY - y) * 2.2
    const dir = delta > 0 ? 1 : -1
    if (!canFlip(dir)) { lastTouchY = y; return }
    scrollAccum += delta
    lastTouchY = y
    if (Math.abs(scrollAccum) >= SCROLL_THRESHOLD) {
      const d = scrollAccum > 0 ? 1 : -1
      scrollAccum = 0
      if (canFlip(d)) setPage(page + d)
    }
  }

  const onKey = (e: KeyboardEvent) => {
    if (zoomedProject !== null) {
      if (e.key === "Escape") zoomOut()
      return
    }
    if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown") {
      if (canFlip(1)) { e.preventDefault(); setPage(page + 1) }
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") {
      if (canFlip(-1)) { e.preventDefault(); setPage(page - 1) }
    }
  }

  // ── Picking ──────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  function getMouse(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  function pickLeaf(e: MouseEvent) {
    getMouse(e)
    raycaster.setFromCamera(mouse, camera)
    const candidates: { leaf: Leaf; side: "front" | "back" }[] = []
    if (delayedPage > 0 && leaves[delayedPage - 1]) candidates.push({ leaf: leaves[delayedPage - 1], side: "back" })
    if (delayedPage < TOTAL && leaves[delayedPage]) candidates.push({ leaf: leaves[delayedPage], side: "front" })
    const meshes = candidates.map((c) => c.leaf.mesh)
    const hits = raycaster.intersectObjects(meshes, false)
    if (!hits.length) return null
    const hit = hits[0]
    const face = hit.face as THREE.Face | null
    if (!face) return null
    const mi = face.materialIndex
    if (mi !== 4 && mi !== 5) return null
    const cand = candidates.find((c) => c.leaf.mesh === hit.object)
    if (!cand) return null
    const side: "front" | "back" = mi === 4 ? "front" : "back"
    const meta = side === "front" ? cand.leaf.spec.frontMeta : cand.leaf.spec.backMeta
    if (meta.kind !== "image" && meta.kind !== "text") return null
    return { leaf: cand.leaf, side, meta, uv: hit.uv ? hit.uv.clone() : null }
  }

  const onMouseMove = (e: MouseEvent) => {
    if (zoomedProject !== null) { canvas.style.cursor = "default"; return }
    const hit = pickLeaf(e)
    for (const lf of leaves) lf.highlighted = false
    if (hit) hit.leaf.highlighted = true
    canvas.style.cursor = hit ? "pointer" : "default"
  }

  const onClick = (e: MouseEvent) => {
    if (zoomedProject !== null) return
    const hit = pickLeaf(e)
    if (!hit) return
    const pIdx = (hit.meta as ImageMeta | TextMeta).projectIdx

    // If clicking the VIEW PROJECT pill button on a text page, navigate directly.
    if (hit.meta.kind === "text" && hit.uv && projects[pIdx]?.url) {
      const { xMin, xMax, yMin, yMax } = TEXT_PAGE_BTN_UV
      if (hit.uv.x > xMin && hit.uv.x < xMax && hit.uv.y > yMin && hit.uv.y < yMax) {
        window.open(projects[pIdx].url!, "_blank", "noopener,noreferrer")
        return
      }
    }

    zoomIn(pIdx)
  }

  function zoomIn(projectIdx: number) {
    if (projectIdx < 0 || projectIdx >= N) return
    zoomedProject = projectIdx
    const p = projects[projectIdx]
    onZoomChange?.({
      eyebrow: `Project · ${String(projectIdx + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}`,
      title: p.title,
      body: p.description,
      tags: p.tags,
      year: p.year,
      status: p.status,
      url: p.url ?? null,
      imageUrl: p.image_url ?? null,
    })
    targetPos.set(0, 0.3, 1.7)
    targetLook.set(0, 0, 0)
  }

  function zoomOut() {
    if (zoomedProject === null) return
    zoomedProject = null
    onZoomChange?.(null)
    targetPos.copy(OVERVIEW_POS)
    targetLook.copy(overviewLookFor(page))
  }

  // ── Easing & per-leaf frame logic (ported from Page useFrame) ────
  function dampAngle(rot: THREE.Euler, axis: "x" | "y" | "z", target: number, smoothing: number, dt: number) {
    const cur = rot[axis]
    let diff = target - cur
    diff = ((diff + Math.PI * 3) % (Math.PI * 2)) - Math.PI
    const lambda = 1 - Math.exp(-dt / Math.max(smoothing, 1e-4))
    rot[axis] = cur + diff * lambda
  }

  function updateLeaf(leaf: Leaf, delta: number) {
    const opened = delayedPage > leaf.number
    const bookClosed = delayedPage === 0 || delayedPage === TOTAL
    leaf.mesh.position.z = -leaf.number * PAGE_DEPTH + delayedPage * PAGE_DEPTH

    const targetEmissive = leaf.highlighted ? HOVER_EMISSIVE : 0
    const mats = leaf.mesh.material as THREE.MeshStandardMaterial[]
    mats[4].emissiveIntensity = THREE.MathUtils.lerp(mats[4].emissiveIntensity, targetEmissive, 0.1)
    mats[5].emissiveIntensity = THREE.MathUtils.lerp(mats[5].emissiveIntensity, targetEmissive, 0.1)

    if (leaf.lastOpened !== opened) {
      leaf.turnedAt = Date.now()
      leaf.lastOpened = opened
    }
    let turningTime = Math.min(400, Date.now() - leaf.turnedAt) / 400
    turningTime = Math.sin(turningTime * Math.PI)

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2
    if (!bookClosed) targetRotation += THREE.MathUtils.degToRad(leaf.number * 0.8)

    const bones = leaf.skeleton.bones
    for (let i = 0; i < bones.length; i++) {
      const target = (i === 0 ? leaf.group : bones[i]) as THREE.Object3D
      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0
      const turningIntensity = Math.sin(i * Math.PI * (1 / bones.length)) * turningTime

      let rotationAngle =
        insideCurveStrength * insideCurveIntensity * targetRotation -
        outsideCurveStrength * outsideCurveIntensity * targetRotation +
        turningCurveStrength * turningIntensity * targetRotation
      let foldRotationAngle = THREE.MathUtils.degToRad(Math.sign(targetRotation) * 2)

      if (bookClosed) {
        if (i === 0) { rotationAngle = targetRotation; foldRotationAngle = 0 }
        else { rotationAngle = 0; foldRotationAngle = 0 }
      }

      dampAngle(target.rotation, "y", rotationAngle, easingFactor, delta)
      const foldIntensity = i > 8 ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime : 0
      dampAngle(target.rotation, "x", foldRotationAngle * foldIntensity, easingFactorFold, delta)
    }
  }

  // ── Resize ───────────────────────────────────────────────────────
  function resize() {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  if (canvas.parentElement) ro.observe(canvas.parentElement)
  resize()

  canvas.addEventListener("wheel", onWheel, { passive: false })
  canvas.addEventListener("touchstart", onTouchStart, { passive: true })
  canvas.addEventListener("touchmove", onTouchMove, { passive: true })
  window.addEventListener("keydown", onKey)
  canvas.addEventListener("mousemove", onMouseMove)
  canvas.addEventListener("click", onClick)

  // ── Loop ─────────────────────────────────────────────────────────
  const clock = new THREE.Clock()
  let rafId = 0
  let stopped = false

  function tick() {
    if (stopped) return
    const dt = Math.min(clock.getDelta(), 0.05)
    for (const lf of leaves) updateLeaf(lf, dt)
    const camLerp = Math.min(1, dt * 2.8)
    camera.position.lerp(targetPos, camLerp)
    currentLook.lerp(targetLook, camLerp)
    camera.lookAt(currentLook)
    renderer.render(scene, camera)
    rafId = requestAnimationFrame(tick)
  }
  tick()
  publishPageChange()

  return {
    destroy() {
      stopped = true
      cancelAnimationFrame(rafId)
      if (pageStepTimer) clearTimeout(pageStepTimer)
      ro.disconnect()
      canvas.removeEventListener("wheel", onWheel)
      canvas.removeEventListener("touchstart", onTouchStart)
      canvas.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("keydown", onKey)
      canvas.removeEventListener("mousemove", onMouseMove)
      canvas.removeEventListener("click", onClick)
      renderer.dispose()
      pageGeometry.dispose()
      for (const lf of leaves) {
        const mats = lf.mesh.material as THREE.MeshStandardMaterial[]
        mats.forEach((m) => m.dispose())
      }
      for (const spec of leafSpecs) {
        spec.frontTex.dispose()
        spec.backTex.dispose()
      }
    },
    closeZoom: zoomOut,
  }
}
