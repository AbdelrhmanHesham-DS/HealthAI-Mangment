import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdownToHtml',
  standalone: true
})
export class MarkdownToHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(markdown: string): SafeHtml {
    if (!markdown) return '';

    let html = markdown;

    // Bold text: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Italic text: *text* or _text_
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Code: `code`
    html = html.replace(/`(.*?)`/g, '<code style="background: rgba(99, 102, 241, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>');

    // Headings: # Heading, ## Heading, etc.
    html = html.replace(/^### (.*?)$/gm, '<h3 style="margin: 1rem 0 0.5rem; font-size: 1.1rem; font-weight: 600;">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 style="margin: 1.5rem 0 0.75rem; font-size: 1.3rem; font-weight: 700;">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 style="margin: 1.5rem 0 0.75rem; font-size: 1.5rem; font-weight: 700;">$1</h1>');

    // Unordered lists: - item or * item
    html = html.replace(/^\s*[-*]\s+(.*?)$/gm, '<li style="margin-left: 1.5rem;">$1</li>');
    html = html.replace(/(<li.*?<\/li>)/s, '<ul style="list-style: disc; margin: 0.5rem 0;">$1</ul>');

    // Numbered lists: 1. item
    html = html.replace(/^\s*\d+\.\s+(.*?)$/gm, '<li style="margin-left: 1.5rem;">$1</li>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraph tags if not already wrapped
    if (!html.includes('<p>')) {
      html = '<p>' + html + '</p>';
    }

    // Links: [text](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: #a5b4fc; text-decoration: underline; cursor: pointer;">$1</a>');

    // Horizontal rule: ---
    html = html.replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid rgba(99, 102, 241, 0.2); margin: 1rem 0;">');

    // Blockquote: > text
    html = html.replace(/^&gt;\s+(.*?)$/gm, '<blockquote style="border-left: 3px solid #6366f1; padding-left: 1rem; margin: 0.5rem 0; color: rgba(255, 255, 255, 0.7);">$1</blockquote>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
