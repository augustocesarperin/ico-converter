// Limites de segurança para prevenir DoS via SVG complexo
const MAX_SVG_ELEMENTS = 5000      // Cobre arte digital muito complexa
const MAX_SVG_DEPTH = 50           // Profundidade realista para SVGs legítimos
const MAX_SVG_SIZE = 5 * 1024 * 1024 // 5MB - equilibrado entre flexibilidade e segurança

const validateSvgComplexity = (input: string): void => {
  // Verificar tamanho do arquivo
  if (input.length > MAX_SVG_SIZE) {
    throw new Error('SVG file too large')
  }

  // Contar elementos aproximadamente (mais rápido que DOM parsing)
  const elementCount = (input.match(/<[^/!?][^>]*>/g) || []).length
  if (elementCount > MAX_SVG_ELEMENTS) {
    throw new Error('SVG too complex (too many elements)')
  }

  // Verificar profundidade de aninhamento aproximada
  let depth = 0
  let maxDepth = 0
  let i = 0
  while (i < input.length) {
    if (input[i] === '<') {
      if (input[i + 1] === '/') {
        depth--
      } else if (input[i + 1] !== '!' && input[i + 1] !== '?') {
        depth++
        maxDepth = Math.max(maxDepth, depth)
      }
    }
    i++
  }
  if (maxDepth > MAX_SVG_DEPTH) {
    throw new Error('SVG too deeply nested')
  }
}

export const sanitizeSvgText = (input: string): string => {
  // Validar complexidade antes do processamento
  validateSvgComplexity(input)

  const parser = new DOMParser()
  const doc = parser.parseFromString(input, 'image/svg+xml')
  const svg = doc.documentElement
  if (!svg || svg.nodeName.toLowerCase() !== 'svg') return input
  const removeNodes = ['script', 'foreignObject']
  removeNodes.forEach(tag => {
    doc.querySelectorAll(tag).forEach(n => n.parentNode?.removeChild(n))
  })
  const walk = (el: Element) => {
    Array.from(el.attributes).forEach(attr => {
      const name = attr.name
      const value = attr.value
      if (name.startsWith('on')) el.removeAttribute(name)
      if ((name === 'href' || name === 'xlink:href') && value && !value.startsWith('#') && !value.startsWith('data:')) el.removeAttribute(name)
      if (name === 'style' && /url\(/i.test(value)) el.removeAttribute(name)
    })
    el.childNodes.forEach(n => {
      if (n.nodeType === 1) walk(n as Element)
    })
  }
  walk(svg)
  const serializer = new XMLSerializer()
  return serializer.serializeToString(doc)
}

export const sanitizeSvgFile = async (file: File): Promise<Blob> => {
  const text = await file.text()
  const safe = sanitizeSvgText(text)
  return new Blob([safe], { type: 'image/svg+xml' })
}


