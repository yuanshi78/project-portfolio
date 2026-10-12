// 图片变体解析工具
//
// JSON 数据里只存「原始相对路径」（如 "rainbow/smart-area/1.png"），
// 实际页面按使用场景请求不同尺寸的变体文件，避免在大屏/放大时加载移动端小图、
// 或反过来用原图拖慢首屏。
//
// 变体文件由 scripts/gen-image-variants.mjs（ImageMagick）预生成，
// 按角色分目录存放（保持原名，镜像原始相对路径）：
//   /images/variants/card-pc/...         项目卡片（PC）
//   /images/variants/card-mobile/...     项目卡片（移动）
//   /images/variants/carousel-pc/...     3D 轮播主图（PC）
//   /images/variants/carousel-mobile/... 3D 轮播主图（移动）
//   /images/variants/zoom-pc/...         点击放大后的大图（PC）
//   /images/variants/zoom-mobile/...     点击放大后的大图（移动）
//   /images/variants/thumb/...           轮播底部缩略图
//
// 不指定角色时使用最大尺寸的预生成图，避免依赖原图目录。
export const resolveImage = (img, variant = 'zoom-pc') => {
  if (!img) return ''

  return `/images/variants/${variant}/${img}`
}

// 各变体目标尺寸 [宽, 高]，均为 16:9，居中裁剪避免拉伸
export const IMAGE_VARIANTS = {
  'card-pc': [800, 450],
  'card-mobile': [480, 270],
  'carousel-pc': [1280, 720],
  'carousel-mobile': [720, 405],
  'zoom-pc': [1600, 900],
  'zoom-mobile': [900, 506],
  'thumb': [200, 112],
}
