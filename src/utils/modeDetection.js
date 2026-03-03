/**
 * Mode Detection Utility for AISA Frontend
 * Mirrors backend mode detection for UI consistency
 */

export const MODES = {
    NORMAL_CHAT: 'NORMAL_CHAT',
    FILE_ANALYSIS: 'FILE_ANALYSIS',
    CONTENT_WRITING: 'CONTENT_WRITING',
    CODING_HELP: 'CODING_HELP',
    TASK_ASSISTANT: 'TASK_ASSISTANT',
    DEEP_SEARCH: 'DEEP_SEARCH',
    DOCUMENT_CONVERT: 'DOCUMENT_CONVERT',
    IMAGE_EDIT: 'IMAGE_EDIT',
    WEB_SEARCH: 'web_search'
};

const EDIT_KEYWORDS = [
    'edit', 'modify', 'change', 'remove', 'add', 'background', 'enhance', 'remix', 'clean up',
    'background remove', 'bg remove', 'remix this', 'enhance this', 'is image me', 'is photo me',
    'badal do', 'hata do', 'saaf kar do'
];

const CODING_KEYWORDS = [
    'code', 'function', 'class', 'debug', 'error', 'bug', 'programming',
    'javascript', 'python', 'java', 'react', 'node', 'api', 'algorithm',
    'syntax', 'compile', 'runtime', 'variable', 'loop', 'array', 'object',
    'database', 'sql', 'html', 'css', 'typescript', 'component', 'import',
    'export', 'async', 'await', 'promise', 'callback', 'fix this code',
    'write a function', 'create a script', 'implement', 'refactor'
];

const WRITING_KEYWORDS = [
    'write', 'article', 'blog', 'essay', 'content', 'draft', 'compose',
    'create a post', 'write about', 'paragraph', 'story', 'letter',
    'email template', 'description', 'summary', 'report', 'document',
    'copywriting', 'marketing copy', 'social media post', 'caption',
    'headline', 'slogan', 'tagline', 'press release'
];

const TASK_KEYWORDS = [
    'task', 'todo', 'plan', 'schedule', 'organize', 'goal', 'objective',
    'steps', 'how to', 'guide me', 'help me plan', 'breakdown', 'roadmap',
    'timeline', 'priority', 'checklist', 'action items', 'strategy',
    'project plan', 'workflow', 'process', 'milestone'
];

export function detectMode(message = '', attachments = []) {
    const lowerMessage = message.toLowerCase().trim();

    if (attachments && attachments.length > 0) {
        const hasImages = attachments.some(a => (a.type && a.type.startsWith('image')) || (a.mimeType && a.mimeType.startsWith('image')));

        if (hasImages) {
            const matchedEdit = EDIT_KEYWORDS.find(keyword => lowerMessage.includes(keyword));
            if (matchedEdit) return MODES.IMAGE_EDIT;
        }

        return MODES.FILE_ANALYSIS;
    }

    const hasCodingKeywords = CODING_KEYWORDS.some(keyword =>
        lowerMessage.includes(keyword)
    );

    const hasCodePattern = /```|function\s*\(|const\s+\w+\s*=|class\s+\w+|import\s+.*from|<\w+>|{\s*\w+:|\/\/|\/\*/.test(message);

    if (hasCodingKeywords || hasCodePattern) {
        return MODES.CODING_HELP;
    }

    const hasWritingKeywords = WRITING_KEYWORDS.some(keyword =>
        lowerMessage.includes(keyword)
    );

    if (hasWritingKeywords) {
        return MODES.CONTENT_WRITING;
    }

    const hasTaskKeywords = TASK_KEYWORDS.some(keyword =>
        lowerMessage.includes(keyword)
    );

    if (hasTaskKeywords) {
        return MODES.TASK_ASSISTANT;
    }

    return MODES.NORMAL_CHAT;
}

export function getModeName(mode) {
    const names = {
        [MODES.NORMAL_CHAT]: 'Chat',
        [MODES.FILE_ANALYSIS]: 'File Analysis',
        [MODES.CONTENT_WRITING]: 'Content Writing',
        [MODES.CODING_HELP]: 'Coding Help',
        [MODES.TASK_ASSISTANT]: 'Task Assistant',
        [MODES.DEEP_SEARCH]: 'Deep Search',
        [MODES.DOCUMENT_CONVERT]: 'Document Convert',
        [MODES.IMAGE_EDIT]: 'Image Edit'
    };
    return names[mode] || 'Chat';
}

export function getModeIcon(mode) {
    const icons = {
        [MODES.NORMAL_CHAT]: '💬',
        [MODES.FILE_ANALYSIS]: '📄',
        [MODES.CONTENT_WRITING]: '✍️',
        [MODES.CODING_HELP]: '💻',
        [MODES.TASK_ASSISTANT]: '📋',
        [MODES.DEEP_SEARCH]: '🔍',
        [MODES.DOCUMENT_CONVERT]: '🔄',
        [MODES.IMAGE_EDIT]: '🎨'
    };
    return icons[mode] || '💬';
}

export function getModeColor(mode) {
    const colors = {
        [MODES.NORMAL_CHAT]: '#6366f1',
        [MODES.FILE_ANALYSIS]: '#8b5cf6',
        [MODES.CONTENT_WRITING]: '#ec4899',
        [MODES.CODING_HELP]: '#10b981',
        [MODES.TASK_ASSISTANT]: '#f59e0b',
        [MODES.DEEP_SEARCH]: '#0ea5e9',
        [MODES.DOCUMENT_CONVERT]: '#10b981',
        [MODES.IMAGE_EDIT]: '#f43f5e'
    };
    return colors[mode] || '#6366f1';
}
