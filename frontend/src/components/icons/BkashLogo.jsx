// Small bKash-branded badge used on payment buttons. This is a stylized
// mark (pink rounded square + "b") rather than the exact bKash logo file,
// since we don't have that asset in the repo.
function BkashLogo({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="0" y="0" width="24" height="24" rx="6" fill="#E2136E" />
      <text
        x="12"
        y="17.5"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
        fill="#ffffff"
      >
        b
      </text>
    </svg>
  )
}

export default BkashLogo
