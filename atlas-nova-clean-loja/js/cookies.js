// Banner de consentimento de cookies; a escolha do usuário (aceitar/rejeitar)
// fica salva no localStorage para não perguntar de novo nas próximas visitas.
const STORAGE_KEY = 'atlas-nova-clean-cookie-consent';

export function initCookieBanner(){
  const banner = document.getElementById('cookie-banner');
  const consent = localStorage.getItem(STORAGE_KEY);

  if(!consent){
    banner.hidden = false;
  }

  document.getElementById('cookie-accept').addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    banner.hidden = true;
  });
  document.getElementById('cookie-reject').addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    banner.hidden = true;
  });
}
