document.getElementById('redirect-to-login-button').addEventListener('click', function () {
  window.location.href = 'login.html'
})

document.getElementById('register-button').addEventListener('click', function () {
  event.preventDefault()
  submitRegistration()
})

function submitRegistration() {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const gender = document.getElementById('gender').value
  const age = document.getElementById('age').value
  const weight = document.getElementById('weight').value
  const name = document.getElementById('name').value

  const data = {
    email,
    password,
    gender,
    age,
    weight,
    name
  }

  console.log('Submitting data', data)

  fetch('http://localhost:2220/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then(function (response) {
    return response.json()
  }).then(function (data) {
    if (data.status === 'success') {
      alert('Register success')
    } else {
      alert('Register failed')
    }
  })
}

document.getElementById('register-button').addEventListener('click', function () {

})