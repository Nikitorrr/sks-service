document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('bookingForm');
  const resultDiv = document.getElementById('formResult');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Простая валидация телефона
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(data.phone.trim())) {
      resultDiv.innerHTML = '<p style="color: #dc2626;">Пожалуйста, введите корректный номер телефона</p>';
      return;
    }

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          equipment: data.equipment,
          description: data.description || ''
        })
      });

      const result = await response.json();

      if (response.ok) {
        resultDiv.innerHTML = '<p style="color: #059669;">✅ Заявка отправлена! Мы перезвоним в течение 15 минут.</p>';
        form.reset();
      } else {
        resultDiv.innerHTML = `<p style="color: #dc2626;">❌ ${result.error || 'Ошибка отправки'}</p>`;
      }
    } catch (err) {
      resultDiv.innerHTML = '<p style="color: #dc2626;">❌ Нет связи с сервером. Попробуйте позже.</p>';
      console.error('Ошибка:', err);
    }
  });
});