import DOMPurify from 'dompurify';

// Configure DOMPurify with safe settings for email content
const sanitizeConfig = {
  ALLOWED_TAGS: [
    // Basic text formatting
    'p', 'br', 'div', 'span',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Text styling
    'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    // Lists
    'ul', 'ol', 'li',
    // Links
    'a',
    // Blockquotes
    'blockquote',
    // Code
    'code', 'pre',
    // Tables
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
    // Line breaks
    'hr',
  ],
  ALLOWED_ATTR: [
    // Link attributes
    'href', 'target', 'rel',
    // Basic styling attributes
    'style', 'class', 'id',
    // Table attributes
    'colspan', 'rowspan', 'width', 'height',
    // Image attributes (if needed)
    'src', 'alt', 'title', 'width', 'height',
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: [
    'script', 'object', 'embed', 'applet', 'form', 'input', 'textarea', 'select', 'option',
    'button', 'fieldset', 'legend', 'label', 'iframe', 'frame', 'frameset', 'noframes',
    'noscript', 'style', 'link', 'meta', 'title', 'head', 'body', 'html', 'xml', 'xmp',
    'listing', 'plaintext', 'listing', 'xmp', 'plaintext', 'listing', 'xmp', 'plaintext'
  ],
  FORBID_ATTR: [
    'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur',
    'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload', 'onabort', 'onbeforeunload',
    'onerror', 'onhashchange', 'onmessage', 'onoffline', 'ononline', 'onpagehide',
    'onpageshow', 'onpopstate', 'onresize', 'onstorage', 'oncontextmenu', 'oninput',
    'oninvalid', 'onsearch', 'onkeydown', 'onkeypress', 'onkeyup', 'onmousedown',
    'onmousemove', 'onmouseup', 'onwheel', 'oncopy', 'oncut', 'onpaste', 'onbeforecopy',
    'onbeforecut', 'onbeforepaste', 'onselectstart', 'onhelp', 'onreadystatechange',
    'onbeforeprint', 'onafterprint', 'onbeforeprint', 'onafterprint', 'onbeforeprint',
    'onafterprint', 'onbeforeprint', 'onafterprint', 'onbeforeprint', 'onafterprint'
  ],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  RETURN_TRUSTED_TYPE: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
  ADD_URI_SAFE_ATTR: ['target'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: false,
  SANITIZE_NAMED_PROPS: false,
  USE_PROFILES: {
    html: true,
    svg: false,
    svgFilters: false,
    mathMl: false
  }
};

/**
 * Sanitizes HTML content to remove potentially dangerous elements and attributes
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML content
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    // Use DOMPurify to sanitize the HTML
    const sanitized = DOMPurify.sanitize(html, sanitizeConfig);
    return sanitized;
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    // Return empty string if sanitization fails
    return '';
  }
}

/**
 * Sanitizes HTML content and returns both sanitized HTML and a boolean indicating if content was modified
 * @param html - The HTML content to sanitize
 * @returns Object with sanitized HTML and modification flag
 */
export function sanitizeHtmlWithCheck(html: string): { sanitized: string; wasModified: boolean } {
  if (!html || typeof html !== 'string') {
    return { sanitized: '', wasModified: false };
  }

  try {
    const originalLength = html.length;
    const sanitized = DOMPurify.sanitize(html, sanitizeConfig);
    const wasModified = sanitized.length !== originalLength || sanitized !== html;

    return { sanitized, wasModified };
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    return { sanitized: '', wasModified: true };
  }
}

/**
 * Checks if HTML content contains potentially dangerous elements
 * @param html - The HTML content to check
 * @returns True if dangerous content is detected
 */
export function hasDangerousContent(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return false;
  }

  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
    /on\w+\s*=/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /data:application\/javascript/gi
  ];

  return dangerousPatterns.some(pattern => pattern.test(html));
}

/**
 * Strips all HTML tags and returns plain text
 * @param html - The HTML content to strip
 * @returns Plain text content
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    // Use DOMPurify to strip all HTML and return text content
    const stripped = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    return stripped;
  } catch (error) {
    console.error('Error stripping HTML:', error);
    // Fallback: basic HTML tag removal
    return html.replace(/<[^>]*>/g, '');
  }
}
