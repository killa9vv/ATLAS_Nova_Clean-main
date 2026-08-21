let hideTimer;

export function showToast(message){
  const el = document.getElementById('add-toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => el.classList.remove('show'), 1700);
}

export function bumpCartCount(){
  const el = document.getElementById('cart-count');
  el.classList.remove('bump');
  void el.offsetWidth; // reinicia a animação mesmo em cliques seguidos
  el.classList.add('bump');
}
