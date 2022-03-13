const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });

    try {
        const taskData = await task.save();
        res.status(201).send(taskData);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sortBy = {};

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const sortOptions = req.query.sortBy.split(':');
        sortOptions[1] = sortOptions[1] === 'asc' ? 1 : -1;

        sortBy[sortOptions[0]] = sortOptions[1];
    }

    try {
        // const taskData = await Task.find({ owner: req.user._id });
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: Number(req.query.limit),
                skip: Number(req.query.page),
                sort: sortBy
            }
        });

        res.send(req.user.tasks);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        // const taskData = await Task.findById(_id);
        const taskData = await Task.findOne({ _id, owner: req.user._id });

        if (!taskData) {
            return res.status(404).send();
        }

        res.send(taskData);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.patch('/tasks/:id', auth, async (req, res) => {
    const updatedFields = Object.keys(req.body);
    const allowedUpdates = ['desc', 'completed'];
    const valid = updatedFields.every((update) => allowedUpdates.includes(update));

    if (!valid) {
        return res.status(400).send({ error: 'Invalid updates' })
    }

    const _id = req.params.id;
    const updates = req.body;

    try {
        const taskData = await Task.findOne({ _id, owner: req.user._id });
        
        if (!taskData) {
            return res.status(404).send();
        }

        updatedFields.forEach((field) => taskData[field] = updates[field]);
        await taskData.save();

        res.send(taskData);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const taskData = await Task.findOneAndDelete({ _id, owner: req.user._id });

        if (!taskData) {
            return res.status(404).send();
        }

        res.send(taskData);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;