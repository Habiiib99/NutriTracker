document.addEventListener('DOMContentLoaded', function () {
  const user = JSON.parse(localStorage.getItem('user'))

  document.getElementById('name').value = user.name
  document.getElementById('email').textContent = user.email
  document.getElementById('weight').value = user.weight
  document.getElementById('age').value = user.age
  document.getElementById('gender').value = user.gender
})

document.getElementById('logout-button').addEventListener('click', function () {
  localStorage.removeItem('user')
  window.location.href = 'login.html'
})

document.getElementById('delete-button').addEventListener('click', function () {
  const user = JSON.parse(localStorage.getItem('user'))

  fetch('http://localhost:2220/api/auth/delete/' + user.userId, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  }).then((response) => response.json()).then((response) => {
    if (response.status === 200) {
      localStorage.removeItem('user')
      window.location.href = 'login.html'
    }
  })
})