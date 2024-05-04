document.addEventListener('DOMContentLoaded', function () {
  const user = JSON.parse(localStorage.getItem('user'))

  document.getElementById('name').value = user.name;
  document.getElementById('email').textContent = user.email;
  document.getElementById('weight').value = user.weight;
  document.getElementById('age').value = user.age;
  document.getElementById('gender').value = user.gender;
  document.getElementById('bmr').value = user.bmr;  // Vis BMR i brugergrænsefladen
})

document.getElementById('logout-button').addEventListener('click', function () {
  localStorage.removeItem('user');
  window.location.href = 'login.html';
})

document.getElementById('update-button').addEventListener('click', function () {
  const userId = JSON.parse(localStorage.getItem('user')).userId;
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').textContent;
  const weight = document.getElementById('weight').value;
  const age = document.getElementById('age').value;
  const gender = document.getElementById('gender').value;

  const data = {
    name, email, weight, age, gender
  };

  fetch(`http://localhost:2220/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    if (data.message) {
      alert(data.message);
      document.getElementById('bmr').value = data.bmr;  // Opdater BMR i brugergrænsefladen
    }
  })
  .catch(error => console.error('Error:', error));
});

document.getElementById('delete-button').addEventListener('click', function () {
  const user = JSON.parse(localStorage.getItem('user'));

  fetch(`http://localhost:2220/delete/${user.userId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  .then(response => response.json())
  .then(data => {
    if (data.message) {
      alert(data.message);
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    }
  })
  .catch(error => console.error('Error:', error));
});
