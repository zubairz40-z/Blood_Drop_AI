function SuggestedPrompts({ prompts = [], onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5 px-4 pb-3">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="px-3 py-1.5 text-xs font-medium text-brand bg-brand-soft/50 hover:bg-brand-soft rounded-full transition-colors cursor-pointer"
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}

export default SuggestedPrompts
