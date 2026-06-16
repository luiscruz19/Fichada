import sanitizeHtml from 'sanitize-html';

export function sanitizeEmailHtml(dirty) {
    return sanitizeHtml(dirty, {
        allowedTags: [
            'p', 'br', 'b', 'i', 'strong', 'em', 'u', 's', 'a', 'img',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
            'span', 'div', 'blockquote', 'hr', 'pre', 'code',
        ],
        allowedAttributes: {
            a: ['href', 'target'],
            img: ['src', 'alt', 'width', 'height'],
            '*': ['style', 'class'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
        allowedStyles: {
            '*': {
                'color': [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(/, /^rgba\(/, /^[a-zA-Z]+$/],
                'background-color': [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(/, /^rgba\(/, /^[a-zA-Z]+$/],
                'font-size': [/^\d+(\.\d+)?(px|em|rem|%)$/],
                'font-weight': [/^\d+$/, /^(normal|bold|bolder|lighter)$/],
                'font-family': [/.*/],
                'text-align': [/^(left|right|center|justify)$/],
                'text-decoration': [/^(none|underline|line-through|overline)$/],
                'text-transform': [/^(none|uppercase|lowercase|capitalize)$/],
                'letter-spacing': [/^\d+(\.\d+)?(px|em)$/],
                'line-height': [/^\d+(\.\d+)?(px|em|rem|%)?$/],
                'padding': [/^\d+(\.\d+)?(px|em|rem|%)(\s\d+(\.\d+)?(px|em|rem|%)){0,3}$/],
                'margin': [/^\d+(\.\d+)?(px|em|rem|%)(\s\d+(\.\d+)?(px|em|rem|%)){0,3}$/],
                'border': [/^\d+(\.\d+)?px\s+(solid|dashed|dotted|double|none)\s+(#[0-9a-fA-F]{3,8}|transparent|[a-zA-Z]+)$/],
                'border-left': [/^\d+(\.\d+)?px\s+(solid|dashed|dotted|double|none)\s+(#[0-9a-fA-F]{3,8}|transparent|[a-zA-Z]+)$/],
                'display': [/^(block|inline|inline-block|flex|table|table-cell|none)$/],
                'width': [/^\d+(\.\d+)?(px|em|rem|%|vw)$/],
                'height': [/^\d+(\.\d+)?(px|em|rem|%|vh)$/],
                'max-width': [/^\d+(\.\d+)?(px|em|rem|%|vw)$/],
                'vertical-align': [/^(top|middle|bottom|baseline|text-top|text-bottom)$/],
            },
        },
        disallowedTagsMode: 'discard',
    });
}

export function sanitizeText(value) {
    if (typeof value !== 'string') return '';
    return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}
