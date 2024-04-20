// Mht. Uni tests...

const chai = require('chai');
const expect = chai.expect;
const { createUser } = require('../src/models/users'); // Passende sti til createUser funktionen


describe('User Management', () => {
  it('should create a user', async () => {
    const user = await createUser('testuser', 'password', 'test@example.com', 25, 'male', 70);
    expect(user).to.have.property('email').that.equals('test@example.com');
  });
});
