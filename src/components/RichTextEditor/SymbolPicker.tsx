import { useState } from 'react';
import { Input } from 'antd';
import { SYMBOL_CATEGORIES, loadRecentSymbols, rememberSymbol, searchSymbols, type SymbolEntry } from './symbols';

interface SymbolPickerProps {
  onPick: (character: string) => void;
}

// Popup body of the symbol button: recently used symbols, a search box and one tab per category
const SymbolPicker = ({ onPick }: SymbolPickerProps) => {
  const [categoryKey, setCategoryKey] = useState(SYMBOL_CATEGORIES[0].key);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>(loadRecentSymbols);

  const isSearching = query.trim() !== '';
  const symbols: SymbolEntry[] = isSearching
    ? searchSymbols(query)
    : SYMBOL_CATEGORIES.find((category) => category.key === categoryKey)?.symbols ?? [];

  const handlePick = (character: string) => {
    onPick(character);
    // The picker stays open so several symbols can be added in a row
    setRecent(rememberSymbol(character));
  };

  const renderButton = ([character, name]: SymbolEntry) => (
    <button
      key={`${character}-${name}`}
      type="button"
      className="rich-text-editor__symbol"
      title={name}
      aria-label={name}
      // Keeps the cursor in the editor while a symbol is clicked
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => handlePick(character)}
    >
      {character}
    </button>
  );

  return (
    <div className="rich-text-editor__symbol-picker">
      <Input
        allowClear
        size="small"
        placeholder="Search symbols, e.g. pi, root, arrow"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {recent.length > 0 && !isSearching && (
        <div className="rich-text-editor__symbol-recent">
          <div className="rich-text-editor__symbol-heading">Recently used</div>
          <div className="rich-text-editor__symbol-grid">{recent.map((character) => renderButton([character, 'recently used']))}</div>
        </div>
      )}

      {!isSearching && (
        <div className="rich-text-editor__symbol-tabs">
          {SYMBOL_CATEGORIES.map((category) => (
            <button
              key={category.key}
              type="button"
              className={`rich-text-editor__symbol-tab${category.key === categoryKey ? ' rich-text-editor__symbol-tab--active' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setCategoryKey(category.key)}
            >
              {category.label}
            </button>
          ))}
        </div>
      )}

      <div className="rich-text-editor__symbol-grid">
        {symbols.length > 0 ? symbols.map(renderButton) : <div className="rich-text-editor__symbol-empty">No symbol found</div>}
      </div>
    </div>
  );
};

export default SymbolPicker;
