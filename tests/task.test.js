const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task');
const { setupDatabase, userOne, userTwo, taskOne } = require('./fixtures/database');

beforeEach(setupDatabase);

test('Should create task for a user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({ desc: 'Buy some eggs' })
        .expect(201);

    const task = await Task.findById(response.body._id);
    
    expect(task).not.toBeNull();
    expect(task.completed).toBeFalsy();
});

test('Should fetch all tasks for a user', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    expect(response.body.length).toBe(2);
});

test('Should not delete task not created by user', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404);
});