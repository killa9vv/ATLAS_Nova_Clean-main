// Avaliações de clientes: formulário de nova avaliação e listagem. Não há
// backend para isso — tudo fica salvo no localStorage do próprio navegador,
// então as avaliações não são compartilhadas entre visitantes diferentes.
const STORAGE_KEY = 'atlas-nova-clean-reviews';

function loadReviews(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReviews(reviews){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

function starsHtml(score){
  return Array.from({length:5}, (_, i) =>
    `<span class="star ${i < score ? 'filled' : ''}">★</span>`
  ).join('');
}

function formatDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });
}

function renderReviews(){
  const reviews = loadReviews();
  const list = document.getElementById('reviews-list');
  const summary = document.getElementById('reviews-summary');

  if(reviews.length === 0){
    summary.innerHTML = `<span class="reviews-empty-summary">Ainda sem avaliações — seja a primeira pessoa a avaliar!</span>`;
    list.innerHTML = `<div class="reviews-empty">Nenhuma avaliação ainda. Assim que alguém avaliar, aparece aqui.</div>`;
    return;
  }

  const avg = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;
  summary.innerHTML = `
    <div class="reviews-avg-stars">${starsHtml(Math.round(avg))}</div>
    <span class="reviews-avg-number mono">${avg.toFixed(1)}</span>
    <span class="reviews-count">${reviews.length} ${reviews.length===1?'avaliação':'avaliações'}</span>
  `;

  list.innerHTML = [...reviews].reverse().map(r => `
    <div class="review-card">
      <div class="review-card-head">
        <span class="review-name">${r.name}</span>
        <span class="review-date">${formatDate(r.date)}</span>
      </div>
      <div class="review-stars">${starsHtml(r.score)}</div>
      <p class="review-comment">${r.comment}</p>
    </div>
  `).join('');
}

export function initReviews(){
  renderReviews();

  const picker = document.getElementById('star-picker');
  picker.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-star]');
    if(!btn) return;
    picker.dataset.value = btn.dataset.star;
    [...picker.children].forEach(c => {
      c.classList.toggle('sel', Number(c.dataset.star) <= Number(btn.dataset.star));
    });
  });

  document.getElementById('review-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('rev-name').value.trim();
    const comment = document.getElementById('rev-comment').value.trim();
    const score = Number(picker.dataset.value);

    if(!name || !comment || score === 0){
      alert('Preencha seu nome, escolha uma nota e escreva um comentário.');
      return;
    }

    const reviews = loadReviews();
    reviews.push({ name, comment, score, date: new Date().toISOString() });
    saveReviews(reviews);
    renderReviews();

    e.target.reset();
    picker.dataset.value = '0';
    [...picker.children].forEach(c => c.classList.remove('sel'));
  });
}
