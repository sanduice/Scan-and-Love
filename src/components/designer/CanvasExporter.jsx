// Canvas exporter utility - generates print-ready files from design elements

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
      if (el.shape === 'circle') {
        return `<ellipse cx="${x + w/2}" cy="${y + h/2}" rx="${w/2}" ry="${h/2}" fill="${el.fill || '#3B82F6'}" ${transform} />`;
      } else if (el.shape === 'rounded-rect') {
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" ry="12" fill="${el.fill || '#3B82F6'}" ${transform} />`;
      } else {
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${el.fill || '#3B82F6'}" ${transform} />`;
      }
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
      if (el.shape === 'circle') {
        return `<ellipse cx="${x + w/2}" cy="${y + h/2}" rx="${w/2}" ry="${h/2}" fill="${el.fill || '#3B82F6'}" ${transform} />`;
      } else if (el.shape === 'rounded-rect') {
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" ry="12" fill="${el.fill || '#3B82F6'}" ${transform} />`;
      } else {
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${el.fill || '#3B82F6'}" ${transform} />`;
      }
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