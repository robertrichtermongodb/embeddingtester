import { useRef } from 'react';
import type { ContentItem } from '../types';

interface Props {
  items: ContentItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ContentItem>) => void;
}

function ItemCard({
  item,
  onRemove,
  onUpdate,
}: {
  item: ContentItem;
  onRemove: () => void;
  onUpdate: (patch: Partial<ContentItem>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdate({ imageDataUrl: reader.result as string, imageName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    onUpdate({ imageDataUrl: null, imageName: null });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={item.label}
          onChange={e => onUpdate({ label: e.target.value })}
          className="text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
        />
        <div className="flex items-center gap-2">
          {item.isEmbedding && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700 flex items-center gap-1">
              <Spinner /> Embedding...
            </span>
          )}
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500 transition-colors text-sm"
            title="Remove item"
          >
            &times;
          </button>
        </div>
      </div>

      <div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        {item.imageDataUrl ? (
          <div className="relative group">
            <img
              src={item.imageDataUrl}
              alt={item.imageName || 'Uploaded'}
              className="w-full max-h-48 object-contain rounded-md border border-gray-100 bg-gray-50"
            />
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={() => {
              if (fileRef.current) fileRef.current.value = '';
              fileRef.current?.click();
            }}
            className="bg-white/90 hover:bg-white text-gray-600 text-[10px] px-2 py-1 rounded shadow-sm"
          >
            Replace
          </button>
              <button
                onClick={removeImage}
                className="bg-white/90 hover:bg-white text-red-500 text-[10px] px-2 py-1 rounded shadow-sm"
              >
                Remove
              </button>
            </div>
            <div className="text-[10px] text-gray-400 mt-1 truncate">{item.imageName}</div>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-6 border-2 border-dashed border-gray-200 rounded-md text-xs text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
          >
            Click to upload an image
          </button>
        )}
      </div>

      <textarea
        value={item.text}
        onChange={e => onUpdate({ text: e.target.value })}
        placeholder="Enter embedding text..."
        rows={3}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
      />
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function ContentPanel({ items, onAdd, onRemove, onUpdate }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Content Items</h2>
          <p className="text-xs text-gray-500">
            Add text and/or images — embeddings are generated automatically when you search
          </p>
        </div>
        <button
          onClick={onAdd}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          + Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            onRemove={() => onRemove(item.id)}
            onUpdate={patch => onUpdate(item.id, patch)}
          />
        ))}
      </div>
    </section>
  );
}
