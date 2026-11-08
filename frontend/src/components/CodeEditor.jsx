/** A plain textarea editor: monospace, Tab inserts four spaces. */
export default function CodeEditor({ value, onChange, label = 'Code editor' }) {
  const onKeyDown = (e) => {
    if (e.key !== 'Tab' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    const { selectionStart: s, selectionEnd: end } = e.target;
    const next = value.slice(0, s) + '    ' + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => { e.target.selectionStart = e.target.selectionEnd = s + 4; });
  };
  return (
    <textarea className="editor" aria-label={label} value={value} spellCheck={false}
              autoCapitalize="off" autoCorrect="off" onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} />
  );
}
