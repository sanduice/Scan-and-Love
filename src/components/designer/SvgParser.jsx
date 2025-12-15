/**
 * SVG Parser Utility
 * Converts SVG elements into canvas-compatible element objects
 */

// Parse color from SVG (handles named colors, hex, rgb, etc.)
const parseColor = (color, defaultColor = '#000000') => {
  if (!color || color === 'none' || color === 'transparent') return null;
  if (color === 'currentColor') return defaultColor;
  return color;
};

// Parse transform attribute
const parseTransform = (transform) => {
  const result = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
  if (!transform) return result;

  // Parse translate
  const translateMatch = transform.match(/translate\(([^)]+)\)/);
  if (translateMatch) {
    const values = translateMatch[1].split(/[\s,]+/).map(Number);
    result.x = values[0] || 0;
    result.y = values[1] || 0;
  }

  // Parse rotate
  const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
  if (rotateMatch) {
    const values = rotateMatch[1].split(/[\s,]+/).map(Number);
    result.rotation = values[0] || 0;
  }

  // Parse scale
  const scaleMatch = transform.match(/scale\(([^)]+)\)/);
  if (scaleMatch) {
    const values = scaleMatch[1].split(/[\s,]+/).map(Number);
    result.scaleX = values[0] || 1;
    result.scaleY = values[1] ?? values[0] ?? 1;
  }

  return result;
};

// Parse style attribute into object
const parseStyle = (styleAttr) => {
  if (!styleAttr) return {};
  const styles = {};
  styleAttr.split(';').forEach(rule => {
    const [key, value] = rule.split(':').map(s => s.trim());
    if (key && value) {
      styles[key] = value;
    }
  });
  return styles;
};

// Get computed style from element (attribute + style)
const getComputedAttr = (el, attr, fallback = null) => {
  const style = parseStyle(el.getAttribute('style'));
  const kebabAttr = attr.replace(/([A-Z])/g, '-$1').toLowerCase();
  return el.getAttribute(attr) || style[kebabAttr] || style[attr] || fallback;
};

// Parse a single SVG element
const parseSvgElement = (el, baseId, scaleFactor = 1) => {
  const tagName = el.tagName.toLowerCase();
  const transform = parseTransform(el.getAttribute('transform'));
  const id = `${baseId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  const fill = parseColor(getComputedAttr(el, 'fill', '#000000'));
  const stroke = parseColor(getComputedAttr(el, 'stroke'));
  const strokeWidth = parseFloat(getComputedAttr(el, 'stroke-width', 1)) * scaleFactor;
  const opacity = parseFloat(getComputedAttr(el, 'opacity', 1));

  const baseElement = {
    id,
    rotation: transform.rotation,
    locked: false,
    visible: true,
    opacity,
  };

  switch (tagName) {
    case 'rect': {
      const x = (parseFloat(el.getAttribute('x') || 0) + transform.x) * scaleFactor;
      const y = (parseFloat(el.getAttribute('y') || 0) + transform.y) * scaleFactor;
      const width = parseFloat(el.getAttribute('width') || 0) * scaleFactor * transform.scaleX;
      const height = parseFloat(el.getAttribute('height') || 0) * scaleFactor * transform.scaleY;
      const rx = parseFloat(el.getAttribute('rx') || 0) * scaleFactor;

      return {
        ...baseElement,
        type: 'shape',
        shape: rx > 0 ? 'rounded-rect' : 'rect',
        x, y, width, height,
        fill: fill || '#3B82F6',
        stroke: stroke || 'none',
        strokeWidth,
        borderRadius: rx,
        name: `Rectangle`,
      };
    }

    case 'circle': {
      const cx = (parseFloat(el.getAttribute('cx') || 0) + transform.x) * scaleFactor;
      const cy = (parseFloat(el.getAttribute('cy') || 0) + transform.y) * scaleFactor;
      const r = parseFloat(el.getAttribute('r') || 0) * scaleFactor;

      return {
        ...baseElement,
        type: 'shape',
        shape: 'circle',
        x: cx - r,
        y: cy - r,
        width: r * 2,
        height: r * 2,
        fill: fill || '#3B82F6',
        stroke: stroke || 'none',
        strokeWidth,
        name: `Circle`,
      };
    }

    case 'ellipse': {
      const cx = (parseFloat(el.getAttribute('cx') || 0) + transform.x) * scaleFactor;
      const cy = (parseFloat(el.getAttribute('cy') || 0) + transform.y) * scaleFactor;
      const rx = parseFloat(el.getAttribute('rx') || 0) * scaleFactor;
      const ry = parseFloat(el.getAttribute('ry') || 0) * scaleFactor;

      return {
        ...baseElement,
        type: 'shape',
        shape: 'circle', // Ellipse rendered as circle with different width/height
        x: cx - rx,
        y: cy - ry,
        width: rx * 2,
        height: ry * 2,
        fill: fill || '#3B82F6',
        stroke: stroke || 'none',
        strokeWidth,
        name: `Ellipse`,
      };
    }

    case 'line': {
      const x1 = parseFloat(el.getAttribute('x1') || 0) * scaleFactor;
      const y1 = parseFloat(el.getAttribute('y1') || 0) * scaleFactor;
      const x2 = parseFloat(el.getAttribute('x2') || 0) * scaleFactor;
      const y2 = parseFloat(el.getAttribute('y2') || 0) * scaleFactor;

      // Convert line to a thin rectangle
      const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

      return {
        ...baseElement,
        type: 'shape',
        shape: 'rect',
        x: x1 + transform.x * scaleFactor,
        y: y1 + transform.y * scaleFactor,
        width: length,
        height: strokeWidth || 2,
        fill: stroke || '#000000',
        stroke: 'none',
        strokeWidth: 0,
        rotation: angle,
        name: `Line`,
      };
    }

    case 'text': {
      const x = (parseFloat(el.getAttribute('x') || 0) + transform.x) * scaleFactor;
      const y = (parseFloat(el.getAttribute('y') || 0) + transform.y) * scaleFactor;
      const fontSize = parseFloat(getComputedAttr(el, 'font-size', 16)) * scaleFactor;
      const fontFamily = getComputedAttr(el, 'font-family', 'Arial');
      const fontWeight = getComputedAttr(el, 'font-weight', 'normal');
      const textAnchor = getComputedAttr(el, 'text-anchor', 'start');
      const text = el.textContent?.trim() || 'Text';

      // Estimate text dimensions
      const estimatedWidth = text.length * fontSize * 0.6;
      const estimatedHeight = fontSize * 1.4;

      let textAlign = 'left';
      if (textAnchor === 'middle') textAlign = 'center';
      if (textAnchor === 'end') textAlign = 'right';

      return {
        ...baseElement,
        type: 'text',
        text,
        x,
        y: y - fontSize, // SVG text baseline is at y, adjust for top-left origin
        width: Math.max(estimatedWidth, 50),
        height: estimatedHeight,
        fontSize: fontSize / scaleFactor, // Store unscaled for canvas rendering
        fontFamily: fontFamily.replace(/['"]/g, ''),
        fontWeight: fontWeight === 'bold' || parseInt(fontWeight) >= 600 ? 'bold' : 'normal',
        fontStyle: getComputedAttr(el, 'font-style', 'normal'),
        color: fill || '#000000',
        textAlign,
        lineHeight: 1.2,
        name: `Text: ${text.substring(0, 20)}${text.length > 20 ? '...' : ''}`,
      };
    }

    case 'image': {
      const x = (parseFloat(el.getAttribute('x') || 0) + transform.x) * scaleFactor;
      const y = (parseFloat(el.getAttribute('y') || 0) + transform.y) * scaleFactor;
      const width = parseFloat(el.getAttribute('width') || 100) * scaleFactor * transform.scaleX;
      const height = parseFloat(el.getAttribute('height') || 100) * scaleFactor * transform.scaleY;
      const href = el.getAttribute('href') || el.getAttribute('xlink:href');

      if (!href) return null;

      return {
        ...baseElement,
        type: 'image',
        src: href,
        x, y, width, height,
        name: `Image`,
      };
    }

    case 'path':
    case 'polygon':
    case 'polyline': {
      // For complex paths, we'll create an SVG image element
      // Get the bounding box
      const bbox = el.getBBox?.();
      if (!bbox || (bbox.width === 0 && bbox.height === 0)) return null;

      const x = (bbox.x + transform.x) * scaleFactor;
      const y = (bbox.y + transform.y) * scaleFactor;
      const width = bbox.width * scaleFactor * transform.scaleX;
      const height = bbox.height * scaleFactor * transform.scaleY;

      // Create an inline SVG for this path
      const svgNS = 'http://www.w3.org/2000/svg';
      const svgWrapper = document.createElementNS(svgNS, 'svg');
      svgWrapper.setAttribute('xmlns', svgNS);
      svgWrapper.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      svgWrapper.setAttribute('width', width.toString());
      svgWrapper.setAttribute('height', height.toString());
      
      const clonedPath = el.cloneNode(true);
      clonedPath.removeAttribute('transform');
      svgWrapper.appendChild(clonedPath);

      const svgString = new XMLSerializer().serializeToString(svgWrapper);
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

      return {
        ...baseElement,
        type: 'clipart',
        src: svgDataUrl,
        x, y, width, height,
        originalPath: el.getAttribute('d') || el.getAttribute('points'),
        name: tagName === 'path' ? 'Path' : tagName === 'polygon' ? 'Polygon' : 'Polyline',
      };
    }

    case 'g': {
      // Groups - return null to process children separately
      return null;
    }

    default:
      return null;
  }
};

// Recursively parse all elements in an SVG
const parseAllElements = (parent, elements, baseId, scaleFactor, depth = 0) => {
  if (depth > 10) return; // Prevent infinite recursion

  const children = parent.children || parent.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType !== 1) continue; // Skip non-element nodes

    const tagName = child.tagName?.toLowerCase();
    if (!tagName) continue;

    // Skip defs, style, metadata
    if (['defs', 'style', 'metadata', 'title', 'desc', 'clipPath', 'mask', 'pattern', 'linearGradient', 'radialGradient'].includes(tagName)) {
      continue;
    }

    if (tagName === 'g' || tagName === 'svg') {
      // Recurse into groups
      parseAllElements(child, elements, baseId, scaleFactor, depth + 1);
    } else {
      const parsed = parseSvgElement(child, baseId, scaleFactor);
      if (parsed) {
        elements.push(parsed);
      }
    }
  }
};

/**
 * Parse an SVG string or URL into editable canvas elements
 * @param {string} svgSource - SVG string or URL
 * @param {number} canvasWidth - Target canvas width in inches
 * @param {number} canvasHeight - Target canvas height in inches
 * @returns {Promise<Array>} Array of canvas element objects
 */
export const parseSvgToElements = async (svgSource, canvasWidth, canvasHeight) => {
  try {
    let svgString = svgSource;

    // If it's a URL, fetch the SVG content
    if (svgSource.startsWith('http') || svgSource.startsWith('/')) {
      const response = await fetch(svgSource);
      if (!response.ok) throw new Error('Failed to fetch SVG');
      svgString = await response.text();
    }

    // Parse the SVG string
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svg = doc.querySelector('svg');

    if (!svg) {
      throw new Error('Invalid SVG: No svg element found');
    }

    // Get SVG dimensions
    const viewBox = svg.getAttribute('viewBox');
    let svgWidth = parseFloat(svg.getAttribute('width')) || 100;
    let svgHeight = parseFloat(svg.getAttribute('height')) || 100;

    if (viewBox) {
      const [, , vbWidth, vbHeight] = viewBox.split(/[\s,]+/).map(Number);
      svgWidth = vbWidth || svgWidth;
      svgHeight = vbHeight || svgHeight;
    }

    // Calculate scale factor to fit canvas
    const scaleX = canvasWidth / svgWidth;
    const scaleY = canvasHeight / svgHeight;
    const scaleFactor = Math.min(scaleX, scaleY);

    // Create a temporary container to get bounding boxes
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.left = '-9999px';
    tempContainer.innerHTML = svgString;
    document.body.appendChild(tempContainer);

    const tempSvg = tempContainer.querySelector('svg');
    const elements = [];
    const baseId = Date.now();

    if (tempSvg) {
      parseAllElements(tempSvg, elements, baseId, scaleFactor);
    }

    document.body.removeChild(tempContainer);

    // If no elements were parsed, create a single image element
    if (elements.length === 0) {
      const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
      return [{
        id: baseId,
        type: 'image',
        src: dataUrl,
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        rotation: 0,
        locked: false,
        visible: true,
        opacity: 1,
        name: 'SVG Image',
      }];
    }

    return elements;
  } catch (error) {
    console.error('Error parsing SVG:', error);
    throw error;
  }
};

export default parseSvgToElements;
