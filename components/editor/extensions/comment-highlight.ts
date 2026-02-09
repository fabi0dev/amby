import { Mark, markInputRule, markPasteRule } from '@tiptap/core';

export const CommentHighlight = Mark.create({
  name: 'commentHighlight',

  inclusive: true,
  group: 'inline',
  inline: true,
  spanning: true,

  addAttributes() {
    return {};
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-highlight]',
      },
    ];
  },

  renderHTML() {
    return [
      'span',
      {
        'data-comment-highlight': 'true',
        class: 'bg-amber-200/70 dark:bg-amber-500/30 rounded-[2px] px-0.5 -mx-0.5 cursor-pointer',
      },
      0,
    ];
  },

  addInputRules() {
    return [];
  },

  addPasteRules() {
    return [];
  },
});

export default CommentHighlight;
