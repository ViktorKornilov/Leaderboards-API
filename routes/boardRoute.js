const express = require('express');
const router = express.Router();

const minNameLength = 3;
const maxNameLength = 10;

let boards = {};

// get all board names
router.get('/', (req, res) => {
    res.send(Object.keys(boards));
});

// get board
router.get('/:boardName', (req, res) => {
    const board = boards[req.params.boardName] || 'Board not found';
    res.send(board);
});

// reset board
router.get('/:boardName/reset', (req, res) => {
    const board = boards[req.params.boardName];
    if (board) {
        boards[req.params.boardName] = {};
        res.send('Board reset');
    } else {
        res.send('Board not found');
    }
});
// Add new score /boardName/name/score
router.get('/:boardName/:name([a-zA-Z][a-zA-Z0-9_-]*)/:score(\\d+)', (req, res) => {
    const { boardName, name, score } = req.params;
    if (name.length < minNameLength || name.length > maxNameLength) {
        return res.status(400).json({ error: `Name length must be between ${minNameLength} and ${maxNameLength}` });
    }

    const board = boards[boardName] = boards[boardName] || {};
    const scoreInt = parseInt(score);

    if (board[name] && board[name] >= scoreInt) {
        return res.status(400).json({ error: 'Score exists and is equal or higher' });
    }

    board[name] = scoreInt;
    boards[boardName] = Object.fromEntries(Object.entries(board).sort(([, a], [, b]) => b - a));
    res.json(board);
});

// Delete score /boardName/name/delete
router.get('/:boardName/:name/delete', (req, res) => {
    const board = boards[req.params.boardName];
    if (!board) {
        return res.status(404).json({ error: 'Board not found' });
    }

    delete board[req.params.name];
    res.json(board);
});

// route get top scores
router.get('/:boardName/:from(\\d+)-:to(\\d+)', (req, res) => {
    const board = boards[req.params.boardName];
    if (!board) {
        return res.status(404).json({ error: 'Board not found' });
    }

    const { from, to } = req.params;
    const top = Object.entries(board).slice(parseInt(from), parseInt(to));
    res.json(top);
});

// route get user score and position. board is already sorted
router.get('/:boardName/:name', (req, res) => {
    const board = boards[req.params.boardName];
    if (!board) {
        return res.status(404).json({ error: 'Board not found' });
    }

    const name = req.params.name;
    if (!board[name]) {
        return res.status(404).json({ error: 'Name not found' });
    }

    const position = Object.keys(board).indexOf(name);
    res.json({ score: board[name], position, total: Object.keys(board).length });
});
// Saving/Loading boards to/from file
const fs = require('fs');
const saveFile = 'data/boards.json';

const saveData = (data) => {
    try {
        fs.writeFileSync(saveFile, JSON.stringify(data));
        console.log('Data saved!');
    } catch (err) {
        console.error(err);
    }
};

const loadData = () => {
    try {
        const data = fs.readFileSync(saveFile);
        return JSON.parse(data);
    } catch (err) {
        console.error(err);
        return {};
    }
};

boards = loadData();

// save boards to file every 30 seconds
setInterval(() => saveData(boards), 1000 * 30);

// save boards to file on exit
process.on('SIGINT', () => {
    saveData(boards);
    process.exit();
});


module.exports = router;