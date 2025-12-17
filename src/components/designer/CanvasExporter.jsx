// Canvas exporter utility - generates print-ready files from design elements

// Shape clip-path definitions (matching CanvasWorkspace.jsx)
const SHAPE_CLIP_PATHS = {
  // Basic shapes
  triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
  star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  pentagon: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
  diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  heart: 'polygon(50% 85%, 15% 55%, 5% 35%, 10% 15%, 25% 5%, 40% 10%, 50% 25%, 60% 10%, 75% 5%, 90% 15%, 95% 35%, 85% 55%)',
  octagon: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
  // Basic arrows
  'arrow-right': 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)',
  'arrow-left': 'polygon(40% 0%, 40% 20%, 100% 20%, 100% 80%, 40% 80%, 40% 100%, 0% 50%)',
  'arrow-up': 'polygon(50% 0%, 100% 40%, 80% 40%, 80% 100%, 20% 100%, 20% 40%, 0% 40%)',
  'arrow-down': 'polygon(20% 0%, 80% 0%, 80% 60%, 100% 60%, 50% 100%, 0% 60%, 20% 60%)',
  'double-arrow': 'polygon(0% 50%, 15% 20%, 15% 40%, 85% 40%, 85% 20%, 100% 50%, 85% 80%, 85% 60%, 15% 60%, 15% 80%)',
  'arrow-simple-right': 'polygon(12% 45%, 62% 45%, 62% 30%, 88% 50%, 62% 70%, 62% 55%, 12% 55%)',
  'arrow-simple-left': 'polygon(88% 45%, 38% 45%, 38% 30%, 12% 50%, 38% 70%, 38% 55%, 88% 55%)',
  'arrow-simple-up': 'polygon(45% 88%, 45% 38%, 30% 38%, 50% 12%, 70% 38%, 55% 38%, 55% 88%)',
  'arrow-simple-down': 'polygon(45% 12%, 45% 62%, 30% 62%, 50% 88%, 70% 62%, 55% 62%, 55% 12%)',
  'arrow-block-right': 'polygon(5% 35%, 60% 35%, 60% 15%, 95% 50%, 60% 85%, 60% 65%, 5% 65%)',
  'arrow-block-left': 'polygon(95% 35%, 40% 35%, 40% 15%, 5% 50%, 40% 85%, 40% 65%, 95% 65%)',
  'arrow-block-up': 'polygon(35% 95%, 35% 40%, 15% 40%, 50% 5%, 85% 40%, 65% 40%, 65% 95%)',
  'arrow-block-down': 'polygon(35% 5%, 35% 60%, 15% 60%, 50% 95%, 85% 60%, 65% 60%, 65% 5%)',
  'arrow-4way': 'polygon(50% 5%, 65% 25%, 55% 25%, 55% 45%, 75% 45%, 75% 35%, 95% 50%, 75% 65%, 75% 55%, 55% 55%, 55% 75%, 65% 75%, 50% 95%, 35% 75%, 45% 75%, 45% 55%, 25% 55%, 25% 65%, 5% 50%, 25% 35%, 25% 45%, 45% 45%, 45% 25%, 35% 25%)',
  'arrow-horizontal': 'polygon(5% 50%, 25% 35%, 25% 45%, 75% 45%, 75% 35%, 95% 50%, 75% 65%, 75% 55%, 25% 55%, 25% 65%)',
  'arrow-vertical': 'polygon(50% 5%, 65% 25%, 55% 25%, 55% 75%, 65% 75%, 50% 95%, 35% 75%, 45% 75%, 45% 25%, 35% 25%)',
  'arrow-bent-right': 'polygon(10% 10%, 10% 50%, 20% 50%, 20% 20%, 70% 20%, 70% 10%, 90% 30%, 70% 50%, 70% 30%, 10% 30%)',
  'arrow-bent-left': 'polygon(90% 10%, 90% 50%, 80% 50%, 80% 20%, 30% 20%, 30% 10%, 10% 30%, 30% 50%, 30% 30%, 90% 30%)',
  'arrow-corner-up': 'polygon(10% 90%, 10% 80%, 70% 80%, 70% 30%, 60% 30%, 80% 10%, 100% 30%, 90% 30%, 90% 90%)',
  'arrow-corner-down': 'polygon(10% 10%, 10% 20%, 70% 20%, 70% 70%, 60% 70%, 80% 90%, 100% 70%, 90% 70%, 90% 10%)',
  'chevron-right': 'polygon(20% 10%, 70% 50%, 20% 90%, 35% 50%)',
  'chevron-left': 'polygon(80% 10%, 30% 50%, 80% 90%, 65% 50%)',
  'chevron-double': 'polygon(10% 10%, 45% 50%, 10% 90%, 25% 50%, 45% 10%, 80% 50%, 45% 90%, 60% 50%)',
  'arrow-pentagon': 'polygon(10% 20%, 75% 20%, 95% 50%, 75% 80%, 10% 80%)',
  'arrow-tag': 'polygon(10% 20%, 75% 20%, 95% 50%, 75% 80%, 10% 80%, 25% 50%)',
  'arrow-notched': 'polygon(10% 10%, 75% 10%, 95% 50%, 75% 90%, 10% 90%, 30% 50%)',
  // Stars
  'star-4point': 'polygon(50% 5%, 60% 40%, 95% 50%, 60% 60%, 50% 95%, 40% 60%, 5% 50%, 40% 40%)',
  'star-5point': 'polygon(50% 5%, 60% 35%, 95% 35%, 68% 55%, 79% 90%, 50% 70%, 21% 90%, 32% 55%, 5% 35%, 40% 35%)',
  'star-6point': 'polygon(50% 5%, 60% 35%, 90% 20%, 70% 45%, 90% 70%, 60% 60%, 50% 95%, 40% 60%, 10% 70%, 30% 45%, 10% 20%, 40% 35%)',
  'star-8point': 'polygon(50% 5%, 58% 33%, 80% 15%, 67% 40%, 95% 50%, 67% 60%, 80% 85%, 58% 67%, 50% 95%, 42% 67%, 20% 85%, 33% 60%, 5% 50%, 33% 40%, 20% 15%, 42% 33%)',
  'star-12point': 'polygon(50% 5%, 55% 28%, 70% 10%, 65% 33%, 90% 25%, 75% 43%, 95% 50%, 75% 58%, 90% 75%, 65% 68%, 70% 90%, 55% 73%, 50% 95%, 45% 73%, 30% 90%, 35% 68%, 10% 75%, 25% 58%, 5% 50%, 25% 43%, 10% 25%, 35% 33%, 30% 10%, 45% 28%)',
  'star-burst': 'polygon(50% 0%, 57% 35%, 98% 20%, 65% 45%, 100% 50%, 65% 55%, 98% 80%, 57% 65%, 50% 100%, 43% 65%, 2% 80%, 35% 55%, 0% 50%, 35% 45%, 2% 20%, 43% 35%)',
  'star-sparkle': 'polygon(50% 10%, 55% 40%, 85% 35%, 60% 50%, 85% 65%, 55% 60%, 50% 90%, 45% 60%, 15% 65%, 40% 50%, 15% 35%, 45% 40%)',
  // Flowers
  'flower-4petal': 'polygon(50% 10%, 65% 30%, 90% 50%, 65% 70%, 50% 90%, 35% 70%, 10% 50%, 35% 30%)',
  'flower-5petal': 'polygon(50% 10%, 60% 30%, 85% 30%, 70% 50%, 85% 70%, 60% 70%, 50% 90%, 40% 70%, 15% 70%, 30% 50%, 15% 30%, 40% 30%)',
  'flower-6petal': 'polygon(50% 5%, 60% 25%, 90% 20%, 70% 45%, 80% 80%, 55% 60%, 50% 95%, 45% 60%, 20% 80%, 30% 45%, 10% 20%, 40% 25%)',
  'flower-8petal': 'polygon(50% 5%, 55% 33%, 85% 10%, 68% 38%, 95% 50%, 68% 62%, 85% 90%, 55% 68%, 50% 95%, 45% 68%, 15% 90%, 32% 62%, 5% 50%, 32% 38%, 15% 10%, 45% 33%)',
  // Hearts
  'heart-simple': 'polygon(50% 90%, 15% 55%, 5% 35%, 10% 18%, 25% 10%, 40% 15%, 50% 30%, 60% 15%, 75% 10%, 90% 18%, 95% 35%, 85% 55%)',
  'heart-rounded': 'polygon(50% 85%, 20% 60%, 20% 40%, 25% 25%, 35% 20%, 45% 25%, 50% 35%, 55% 25%, 65% 20%, 75% 25%, 80% 40%, 80% 60%)',
  // Weather
  'cloud': 'polygon(80% 70%, 25% 70%, 10% 70%, 10% 55%, 15% 40%, 25% 35%, 35% 30%, 45% 25%, 55% 25%, 70% 30%, 80% 35%, 90% 45%, 95% 55%, 90% 70%)',
  'sun': 'polygon(50% 30%, 60% 35%, 70% 25%, 65% 40%, 85% 50%, 65% 60%, 70% 75%, 60% 65%, 50% 70%, 40% 65%, 30% 75%, 35% 60%, 15% 50%, 35% 40%, 30% 25%, 40% 35%)',
  'sun-rays': 'polygon(50% 25%, 57% 35%, 75% 25%, 63% 40%, 90% 50%, 63% 60%, 75% 75%, 57% 63%, 50% 75%, 43% 63%, 25% 75%, 37% 60%, 10% 50%, 37% 40%, 25% 25%, 43% 35%)',
  'moon-crescent': 'polygon(60% 10%, 40% 20%, 30% 40%, 30% 60%, 40% 80%, 60% 90%, 45% 85%, 25% 70%, 15% 50%, 25% 30%, 45% 15%)',
  'lightning': 'polygon(60% 5%, 35% 45%, 50% 45%, 30% 95%, 70% 50%, 55% 50%)',
  'raindrop': 'polygon(50% 10%, 30% 50%, 25% 65%, 30% 80%, 40% 90%, 50% 90%, 60% 90%, 70% 80%, 75% 65%, 70% 50%)',
  // Misc
  'location-pin': 'polygon(50% 5%, 75% 25%, 80% 45%, 70% 65%, 50% 95%, 30% 65%, 20% 45%, 25% 25%)',
  'cross-plus': 'polygon(40% 10%, 60% 10%, 60% 40%, 90% 40%, 90% 60%, 60% 60%, 60% 90%, 40% 90%, 40% 60%, 10% 60%, 10% 40%, 40% 40%)',
  'cross-x': 'polygon(20% 10%, 50% 40%, 80% 10%, 90% 20%, 60% 50%, 90% 80%, 80% 90%, 50% 60%, 20% 90%, 10% 80%, 40% 50%, 10% 20%)',
  'checkmark': 'polygon(10% 50%, 35% 75%, 90% 20%, 80% 10%, 35% 55%, 20% 40%)',
  // Flowchart shapes
  'flow-process': 'polygon(10% 20%, 90% 20%, 90% 80%, 10% 80%)',
  'flow-decision': 'polygon(50% 10%, 95% 50%, 50% 90%, 5% 50%)',
  'flow-terminal': 'polygon(25% 20%, 75% 20%, 95% 50%, 75% 80%, 25% 80%, 5% 50%)',
  'flow-data': 'polygon(20% 20%, 90% 20%, 80% 80%, 10% 80%)',
  'flow-document': 'polygon(10% 15%, 90% 15%, 90% 75%, 50% 90%, 10% 75%)',
  'flow-manual': 'polygon(5% 20%, 95% 20%, 85% 80%, 15% 80%)',
  'flow-preparation': 'polygon(25% 20%, 75% 20%, 95% 50%, 75% 80%, 25% 80%, 5% 50%)',
  'flow-off-page': 'polygon(10% 10%, 90% 10%, 90% 70%, 50% 90%, 10% 70%)',
  'flow-merge': 'polygon(10% 10%, 90% 10%, 50% 90%)',
  'flow-extract': 'polygon(50% 10%, 90% 90%, 10% 90%)',
  'flow-sort': 'polygon(50% 10%, 90% 50%, 50% 90%, 10% 50%)',
  'pie-half': 'polygon(50% 50%, 50% 10%, 90% 30%, 90% 70%, 50% 90%)',
  'pie-quarter': 'polygon(50% 50%, 50% 10%, 90% 50%)',
  // Blobs
  'blob-1': 'polygon(70% 15%, 90% 35%, 85% 60%, 55% 90%, 20% 85%, 10% 55%, 15% 25%, 45% 5%)',
  'blob-2': 'polygon(80% 30%, 95% 55%, 75% 85%, 40% 95%, 10% 75%, 5% 40%, 25% 15%, 60% 5%)',
  'blob-3': 'polygon(65% 10%, 95% 25%, 90% 60%, 70% 90%, 30% 95%, 5% 70%, 10% 30%, 40% 5%)',
  'blob-4': 'polygon(75% 20%, 90% 45%, 80% 80%, 45% 95%, 10% 80%, 5% 45%, 20% 15%, 55% 5%)',
  'blob-5': 'polygon(60% 15%, 90% 30%, 85% 65%, 55% 90%, 20% 85%, 10% 50%, 20% 20%, 45% 5%)',
  'blob-6': 'polygon(70% 10%, 95% 35%, 90% 70%, 60% 95%, 20% 90%, 5% 55%, 15% 20%, 45% 5%)',
  'blob-7': 'polygon(50% 5%, 85% 15%, 95% 50%, 80% 85%, 45% 95%, 10% 80%, 5% 45%, 20% 15%)',
  'blob-8': 'polygon(65% 20%, 90% 40%, 80% 80%, 45% 95%, 10% 75%, 5% 40%, 25% 10%, 55% 5%)',
  'abstract-flower': 'polygon(50% 20%, 65% 5%, 80% 20%, 95% 35%, 80% 50%, 95% 65%, 80% 80%, 65% 95%, 50% 80%, 35% 95%, 20% 80%, 5% 65%, 20% 50%, 5% 35%, 20% 20%, 35% 5%)',
  'abstract-star': 'polygon(50% 10%, 60% 35%, 85% 35%, 65% 55%, 80% 85%, 50% 65%, 20% 85%, 35% 55%, 15% 35%, 40% 35%)',
  'abstract-plus': 'polygon(35% 5%, 65% 5%, 65% 35%, 95% 35%, 95% 65%, 65% 65%, 65% 95%, 35% 95%, 35% 65%, 5% 65%, 5% 35%, 35% 35%)',
  'squiggle-wave': 'polygon(5% 50%, 15% 25%, 25% 50%, 35% 25%, 45% 50%, 55% 25%, 65% 50%, 75% 25%, 85% 50%, 95% 25%, 95% 70%, 85% 45%, 75% 70%, 65% 45%, 55% 70%, 45% 45%, 35% 70%, 25% 45%, 15% 70%, 5% 45%)',
  'organic-oval': 'polygon(50% 10%, 85% 20%, 95% 50%, 85% 80%, 50% 90%, 15% 80%, 5% 50%, 15% 20%)',
  'organic-pill': 'polygon(30% 20%, 70% 20%, 95% 50%, 70% 80%, 30% 80%, 5% 50%)',
  'organic-pebble': 'polygon(45% 10%, 80% 15%, 90% 45%, 75% 80%, 40% 95%, 15% 75%, 5% 45%, 20% 15%)',
  // Speech bubbles
  'speech-round-bl': 'polygon(10% 10%, 90% 10%, 90% 70%, 40% 70%, 15% 95%, 25% 70%, 10% 70%)',
  'speech-round-br': 'polygon(10% 10%, 90% 10%, 90% 70%, 75% 70%, 85% 95%, 60% 70%, 10% 70%)',
  'speech-round-bc': 'polygon(5% 10%, 95% 10%, 95% 65%, 60% 65%, 50% 95%, 40% 65%, 5% 65%)',
  'speech-rect-bl': 'polygon(0% 0%, 100% 0%, 100% 75%, 35% 75%, 15% 100%, 25% 75%, 0% 75%)',
  'speech-rect-br': 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 85% 100%, 65% 75%, 0% 75%)',
  'speech-rect-bc': 'polygon(0% 0%, 100% 0%, 100% 70%, 60% 70%, 50% 100%, 40% 70%, 0% 70%)',
  'callout-left': 'polygon(25% 0%, 100% 0%, 100% 100%, 25% 100%, 0% 50%)',
  'callout-right': 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%)',
  // Ribbons
  'ribbon-wave': 'polygon(0% 20%, 10% 0%, 10% 20%, 90% 20%, 90% 0%, 100% 20%, 100% 80%, 90% 100%, 90% 80%, 10% 80%, 10% 100%, 0% 80%)',
  'ribbon-banner': 'polygon(0% 10%, 100% 10%, 100% 70%, 85% 70%, 100% 100%, 75% 70%, 25% 70%, 0% 100%, 15% 70%, 0% 70%)',
  'badge-shield': 'polygon(0% 0%, 100% 0%, 100% 65%, 50% 100%, 0% 65%)',
  'starburst': 'polygon(50% 0%, 57% 35%, 98% 20%, 65% 45%, 100% 50%, 65% 55%, 98% 80%, 57% 65%, 50% 100%, 43% 65%, 2% 80%, 35% 55%, 0% 50%, 35% 45%, 2% 20%, 43% 35%)',
  'geo-hexagon': 'polygon(50% 5%, 90% 28%, 90% 72%, 50% 95%, 10% 72%, 10% 28%)',
  'geo-diamond': 'polygon(50% 5%, 95% 50%, 50% 95%, 5% 50%)',
};

// Convert CSS polygon() to SVG polygon points
function clipPathToSvgPoints(clipPath, width, height) {
  if (!clipPath || !clipPath.startsWith('polygon(')) return null;
  
  // Extract the content between polygon( and )
  const pointsStr = clipPath.slice(8, -1);
  
  // Split by comma and convert each point
  const points = pointsStr.split(',').map(pair => {
    const [xStr, yStr] = pair.trim().split(/\s+/);
    const xPercent = parseFloat(xStr);
    const yPercent = parseFloat(yStr);
    const x = (xPercent / 100) * width;
    const y = (yPercent / 100) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  
  return points.join(' ');
}

// Scale SVG path data from viewBox to target dimensions
function scaleSvgPath(pathData, viewBox, targetWidth, targetHeight) {
  const [, , vbWidth, vbHeight] = (viewBox || '0 0 40 40').split(' ').map(Number);
  const scaleX = targetWidth / vbWidth;
  const scaleY = targetHeight / vbHeight;
  
  // Simple path scaling - transform coordinates
  return pathData.replace(/([0-9.-]+)/g, (match, num, offset, str) => {
    const val = parseFloat(num);
    // Determine if this is an X or Y coordinate based on position
    // This is a simplified approach - for complex paths, use a proper SVG library
    return val.toFixed(2);
  });
}

// Convert image URL to base64 for embedding in SVG
async function imageUrlToBase64(url) {
  try {
    // For data URLs, return as-is
    if (url.startsWith('data:')) return url;
    
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Failed to convert image to base64:', url, err);
    return url; // Return original URL if conversion fails
  }
}

// Render a shape element to SVG
function renderShapeToSvg(el, x, y, w, h, transform) {
  const fill = el.fill || '#3B82F6';
  const clipPath = SHAPE_CLIP_PATHS[el.shape];
  
  // Circle - render as ellipse
  if (el.shape === 'circle') {
    return `<ellipse cx="${x + w/2}" cy="${y + h/2}" rx="${w/2}" ry="${h/2}" fill="${fill}" ${transform} />`;
  }
  
  // Rounded rectangle
  if (el.shape === 'rounded-rect') {
    const radius = Math.min(w, h) * 0.15;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="${fill}" ${transform} />`;
  }
  
  // Shapes with SVG path data (arches, curves)
  if (el.svgPath) {
    const viewBox = el.svgViewBox || '0 0 40 40';
    return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${viewBox}" preserveAspectRatio="none" ${transform}>
      <path d="${el.svgPath}" fill="${fill}" />
    </svg>`;
  }
  
  // Ellipse clip-paths (smiley, flow-connector, etc.)
  if (clipPath?.startsWith('ellipse(')) {
    return `<ellipse cx="${x + w/2}" cy="${y + h/2}" rx="${w/2}" ry="${h/2}" fill="${fill}" ${transform} />`;
  }
  
  // Polygon clip-paths - convert to SVG polygon
  if (clipPath?.startsWith('polygon(')) {
    const points = clipPathToSvgPoints(clipPath, w, h);
    if (points) {
      // For polygon, we need to translate the points
      const translatedPoints = points.split(' ').map(pt => {
        const [px, py] = pt.split(',').map(Number);
        return `${(px + x).toFixed(2)},${(py + y).toFixed(2)}`;
      }).join(' ');
      
      // Handle rotation separately for polygon
      if (el.rotation) {
        const cx = x + w/2;
        const cy = y + h/2;
        return `<polygon points="${translatedPoints}" fill="${fill}" transform="rotate(${el.rotation} ${cx} ${cy})" />`;
      }
      return `<polygon points="${translatedPoints}" fill="${fill}" />`;
    }
  }
  
  // Fallback to rectangle
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${transform} />`;
}

// Generate SVG with embedded images (async version)
export async function generateSVGWithImages(elements, width, height, dpi = 150) {
  const widthPx = width * dpi;
  const heightPx = height * dpi;
  const scale = dpi;

  // Convert all images to base64 first
  const elementsWithBase64 = await Promise.all(
    elements.map(async (el) => {
      if ((el.type === 'image' || el.type === 'clipart') && el.src) {
        const base64Src = await imageUrlToBase64(el.src);
        return { ...el, base64Src };
      }
      return el;
    })
  );

  let svgContent = elementsWithBase64.map(el => {
    const x = el.x * scale;
    const y = el.y * scale;
    const w = el.width * scale;
    const h = el.height * scale;
    const rotation = el.rotation || 0;
    const transform = rotation ? `transform="rotate(${rotation} ${x + w/2} ${y + h/2})"` : '';

    if (el.type === 'shape') {
      return renderShapeToSvg(el, x, y, w, h, transform);
    } else if (el.type === 'text') {
      const fontSize = (el.fontSize || 4) * scale;
      const fontWeight = el.fontWeight || 'normal';
      const fontFamily = el.fontFamily || 'Arial';
      const textColor = el.color || '#000000';
      const textAlign = el.textAlign || 'center';
      
      let textAnchor = 'middle';
      let textX = x + w / 2;
      if (textAlign === 'left') {
        textAnchor = 'start';
        textX = x + 4;
      } else if (textAlign === 'right') {
        textAnchor = 'end';
        textX = x + w - 4;
      }
      
      const textY = y + h / 2;
      const escapedText = (el.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      return `<text x="${textX}" y="${textY}" fill="${textColor}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}" text-anchor="${textAnchor}" dominant-baseline="middle" ${transform}>${escapedText}</text>`;
    } else if (el.type === 'image' || el.type === 'clipart') {
      const src = el.base64Src || el.src;
      if (src) {
        return `<image href="${src}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" ${transform} />`;
      }
    }
    return '';
  }).filter(Boolean).join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">
  <title>Print-ready artwork at ${dpi} DPI - ${width}" x ${height}"</title>
  <rect width="100%" height="100%" fill="white"/>
  ${svgContent}
</svg>`;
}

// Sync version for thumbnails (uses external URLs)
export function generateSVG(elements, width, height, dpi = 150) {
  const widthPx = width * dpi;
  const heightPx = height * dpi;
  const scale = dpi;

  let svgContent = elements.map(el => {
    const x = el.x * scale;
    const y = el.y * scale;
    const w = el.width * scale;
    const h = el.height * scale;
    const rotation = el.rotation || 0;
    const transform = rotation ? `transform="rotate(${rotation} ${x + w/2} ${y + h/2})"` : '';

    if (el.type === 'shape') {
      return renderShapeToSvg(el, x, y, w, h, transform);
    } else if (el.type === 'text') {
      const fontSize = (el.fontSize || 4) * scale;
      const fontWeight = el.fontWeight || 'normal';
      const fontFamily = el.fontFamily || 'Arial';
      const textColor = el.color || '#000000';
      const textAlign = el.textAlign || 'center';
      
      let textAnchor = 'middle';
      let textX = x + w / 2;
      if (textAlign === 'left') {
        textAnchor = 'start';
        textX = x + 4;
      } else if (textAlign === 'right') {
        textAnchor = 'end';
        textX = x + w - 4;
      }
      
      const textY = y + h / 2;
      const escapedText = (el.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      return `<text x="${textX}" y="${textY}" fill="${textColor}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}" text-anchor="${textAnchor}" dominant-baseline="middle" ${transform}>${escapedText}</text>`;
    } else if (el.type === 'image' || el.type === 'clipart') {
      if (el.src) {
        return `<image href="${el.src}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" ${transform} />`;
      }
    }
    return '';
  }).filter(Boolean).join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">
  <title>Print-ready artwork at ${dpi} DPI - ${width}" x ${height}"</title>
  <rect width="100%" height="100%" fill="white"/>
  ${svgContent}
</svg>`;
}

export async function downloadSVG(elements, width, height, dpi = 150, filename = 'design.svg') {
  const svg = await generateSVGWithImages(elements, width, height, dpi);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

export function generateDataURL(elements, width, height, dpi = 72) {
  const svg = generateSVG(elements, width, height, dpi);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export async function generatePNG(elements, width, height, dpi = 150) {
  const svg = await generateSVGWithImages(elements, width, height, dpi);
  const widthPx = width * dpi;
  const heightPx = height * dpi;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = widthPx;
      canvas.height = heightPx;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, widthPx, heightPx);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to generate PNG'));
    };
    
    img.src = url;
  });
}

export async function downloadPNG(elements, width, height, dpi = 150, filename = 'design.png') {
  const blob = await generatePNG(elements, width, height, dpi);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

// Generate a thumbnail for preview (smaller, lower DPI) - sync version without images
export function generateThumbnail(elements, width, height) {
  return generateDataURL(elements, width, height, 10);
}

// Generate a thumbnail with embedded images (async version)
export async function generateThumbnailWithImages(elements, width, height) {
  const svg = await generateSVGWithImages(elements, width, height, 10);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Generate SVG with embedded images and return as data URL
export async function generateArtworkDataURL(elements, width, height, dpi = 150) {
  const svg = await generateSVGWithImages(elements, width, height, dpi);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Download as PDF (generates PNG and wraps it)
export async function downloadPDF(elements, width, height, dpi = 150, filename = 'design.pdf') {
  const blob = await generatePNG(elements, width, height, dpi);
  const url = URL.createObjectURL(blob);
  
  // Create a printable HTML document with the image
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // Fallback: download as PNG if popup blocked
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.pdf', '.png');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }

  // Create print-ready document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        @page {
          size: ${width}in ${height}in;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        img {
          width: ${width}in;
          height: ${height}in;
          object-fit: contain;
        }
        @media print {
          body { margin: 0; }
          img { max-width: 100%; height: auto; }
        }
      </style>
    </head>
    <body>
      <img src="${url}" alt="Design" onload="window.print(); setTimeout(() => window.close(), 1000);" />
    </body>
    </html>
  `);
  printWindow.document.close();
  
  return true;
}
