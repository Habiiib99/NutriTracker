document.getElementById('redirect-to-register-button').addEventListener('click', function () {
    window.location.href = 'register.html'
  })
  
  document.getElementById('login-button').addEventListener('click', function () {
    event.preventDefault()
    console.log('gdfgdfs')
  
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
  
    const data = {
      email: email,
      password: password
    }
  
    fetch('http://localhost:2220/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(function (response) {
      if (response.status !== 200) {
        return alert('Invalid credentials')
      }
      return response.json()
    }).then(function (data) {
      console.log(data)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.location.href = 'mealtracker.html'
    })
  })