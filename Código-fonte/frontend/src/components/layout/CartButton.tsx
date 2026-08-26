export interface CartButtonProps {
  /**
   * Puramente apresentacional — o estado real do carrinho (e o drawer que
   * ele deveria abrir) é escopo do cartão "Carrinho (UI + estado global)".
   * Por enquanto aceita uma contagem (default 0) e um onClick opcional.
   */
  count?: number;
  onClick?: () => void;
}

export function CartButton({ count = 0, onClick }: CartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
      className="flex items-center gap-2 rounded-[20px] bg-navy py-[9px] pl-3.5 pr-4 text-[13px] font-semibold text-white hover:bg-navy-2 max-[360px]:gap-1.5 max-[360px]:px-3"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <span className="max-[360px]:hidden">Sua lista</span>
      <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber text-[11px] font-bold text-navy">
        {count}
      </span>
    </button>
  );
}
