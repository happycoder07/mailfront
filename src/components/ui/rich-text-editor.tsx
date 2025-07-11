'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Type,
  Palette,
} from 'lucide-react';
import { useState } from 'react';
import { sanitizeHtml, sanitizeHtmlWithCheck } from '@/lib/sanitize';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const fontSizes = [
  { label: 'Small', value: 'text-sm' },
  { label: 'Normal', value: 'text-base' },
  { label: 'Large', value: 'text-lg' },
  { label: 'Extra Large', value: 'text-xl' },
  { label: 'Huge', value: 'text-2xl' },
];

const colors = [
  { label: 'Default', value: '#000000' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Gray', value: '#6b7280' },
];

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const rawHtml = editor.getHTML();
      // Sanitize the HTML content before passing it to onChange
      const { sanitized, wasModified } = sanitizeHtmlWithCheck(rawHtml);

      if (wasModified) {
        console.warn('Potentially unsafe content was removed from the editor');
      }

      onChange(sanitized);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      // Sanitize the URL before adding it
      const sanitizedUrl = sanitizeHtml(linkUrl);
      if (sanitizedUrl) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: sanitizedUrl }).run();
      }
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  };

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  return (
    <div className={`border rounded-md relative ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-2 flex flex-wrap items-center gap-2">
        {/* Text Formatting */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Color Picker */}
        <Select onValueChange={setColor}>
          <SelectTrigger className="w-20">
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            {colors.map(color => (
              <SelectItem key={color.value} value={color.value}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: color.value }}
                  />
                  {color.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Text Alignment */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>

        {/* Link */}
        <div className="flex items-center gap-1">
          {showLinkInput ? (
            <div className="flex items-center gap-1">
              <input
                type="url"
                placeholder="Enter URL"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                className="px-2 py-1 text-sm border rounded"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    addLink();
                  }
                }}
              />
              <Button type="button" size="sm" onClick={addLink}>
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowLinkInput(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant={editor.isActive('link') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowLinkInput(true)}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              {editor.isActive('link') && (
                <Button type="button" variant="ghost" size="sm" onClick={removeLink}>
                  <Unlink className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="min-h-[200px] max-h-[400px] overflow-y-auto relative">
        <EditorContent editor={editor} />
        {!value && placeholder && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
