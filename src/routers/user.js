const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeMail, sendPartingMail } = require('../emails/account');
const User = require('../models/user');
const auth = require('../middleware/auth');

const router = new express.Router();

const storage = multer.memoryStorage();

const avatar = multer({
    storage: storage,
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpe?g|png)$/)) {
            return callback(new Error('Please upload an image'));
        };

        callback(undefined, true);
    }
});

router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        const userData = await user.save();
        const token = await userData.generateAuthToken();

        sendWelcomeMail(user.email, user.name);

        res.status(201).send({ user: userData, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post('/users/login', async (req, res) => {
    const credentials = req.body;

    try {
        const userData = await User.findByCredentials(credentials.email, credentials.password);
        const token = await userData.generateAuthToken();
        
        res.send({ user: userData, token });
    } catch (error) {
        res.status(400).send(error)
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((tokenData) => {
            return tokenData.token !== req.token;
        });

        await req.user.save()

        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];

        await req.user.save()

        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.post('/users/me/avatar', auth, avatar.single('avatar'), async (req, res) => {
    try {
        const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

        req.user.avatar = buffer;
        await req.user.save()

        res.send();
    } catch(error) {
        res.status(500).send();
    }
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.get('/users/:id/avatar', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const user = await User.findById(_id);
        
        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (error) {
        res.status(404).send();
    }
});

router.patch('/users/me', auth, async (req, res) => {
    const updatedFields = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const valid = updatedFields.every((update) => allowedUpdates.includes(update));

    if (!valid) {
        return res.status(400).send({ error: 'Invalid updates' })
    }

    const updates = req.body;

    try {
        updatedFields.forEach((field) => req.user[field] = updates[field]);
        await req.user.save();

        res.send(req.user);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.delete();

        sendPartingMail(req.user.email, req.user.name);
        
        res.send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;

    await req.user.save();

    res.send();
}, (error, req, res, next) => {
    res.status(500).send({ error: error.message });
});

module.exports = router;