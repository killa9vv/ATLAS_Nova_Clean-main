// Efeito de revelar seções ao rolar a página, usando IntersectionObserver.
// Desativado automaticamente se o usuário preferir movimento reduzido.
export function initScrollReveal(){
  const targets = document.querySelectorAll('[data-reveal]');
  if(!targets.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(prefersReduced){
    targets.forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(el => observer.observe(el));
}
