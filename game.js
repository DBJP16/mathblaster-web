{\rtf1\ansi\ansicpg1252\cocoartf2821
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fmodern\fcharset0 Courier;}
{\colortbl;\red255\green255\blue255;\red0\green0\blue0;}
{\*\expandedcolortbl;;\cssrgb\c0\c0\c0;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs26\fsmilli13333 \cf0 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 const config = \{\
    type: Phaser.AUTO,\
    width: 800,\
    height: 600,\
    scene: \{\
        preload: preload,\
        create: create,\
        update: update\
    \},\
    physics: \{\
        default: 'arcade',\
        arcade: \{ debug: false \}\
    \}\
\};\
\
const game = new Phaser.Game(config);\
\
let player, bullets, enemyBullets, answerShips, questionText, scoreText, livesText, instrText, gameOverText, playerName = "";\
let score = 0, lives = 3, gameOver = false, question = null;\
const fontStyle = \{ font: "30px Arial", fill: "#FFFFFF" \};\
const blueStyle = \{ font: "30px Arial", fill: "#0000FF" \};\
\
function preload() \{\
    // No external assets needed for now\'97using shapes\
\}\
\
function create() \{\
    // Profile entry\
    profileScreen(this);\
\}\
\
function update() \{\
    if (!playerName) return; // Wait for name entry\
\
    if (!gameOver) \{\
        // Player movement\
        const cursors = this.input.keyboard.createCursorKeys();\
        if (cursors.left.isDown && player.x > 25) player.x -= 5;\
        if (cursors.right.isDown && player.x < 775) player.x += 5;\
\
        // Update answer ships\
        answerShips.getChildren().forEach(ship => \{\
            ship.update();\
            if (ship.y > 540) \{\
                lives--;\
                spawnQuestion(this);\
                updateHUD();\
            \}\
        \});\
\
        // Update player bullets\
        bullets.getChildren().forEach(bullet => \{\
            bullet.y += bullet.speed;\
            if (bullet.y < 0) bullet.destroy();\
            answerShips.getChildren().forEach(ship => \{\
                if (checkCollision(bullet, ship)) \{\
                    bullet.destroy();\
                    ship.destroy();\
                    if (ship.number === question.answer) score += 10;\
                    else lives--;\
                    spawnQuestion(this);\
                    updateHUD();\
                \}\
            \});\
        \});\
\
        // Update enemy bullets\
        enemyBullets.getChildren().forEach(bullet => \{\
            bullet.y += bullet.speed;\
            if (bullet.y > 600) bullet.destroy();\
            else if (checkCollision(bullet, player)) \{\
                bullet.destroy();\
                lives--;\
                updateHUD();\
            \}\
        \});\
\
        if (lives <= 0) \{\
            gameOver = true;\
            saveLeaderboard();\
            showGameOver(this);\
        \}\
    \}\
\}\
\
// Question generator\
function generateQuestion() \{\
    const a = Math.floor(Math.random() * 10) + 1;\
    const op = Math.random() < 0.5 ? "+" : "-";\
    let b, answer;\
    if (op === "+") \{\
        b = Math.floor(Math.random() * (10 - a)) + 1;\
        answer = a + b;\
    \} else \{\
        b = Math.floor(Math.random() * a) + 1;\
        answer = a - b;\
    \}\
    return \{ a, b, op, answer, text: `$\{a\} $\{op\} $\{b\} = ?` \};\
\}\
\
// Answer ship\
class AnswerShip extends Phaser.GameObjects.Triangle \{\
    constructor(scene, x, number) \{\
        super(scene, x, 50, 25, 0, 0, 50, 50, 50, 0xFF0000);\
        scene.add.existing(this);\
        this.number = number;\
        this.speedX = (Math.random() < 0.5 ? -1 : 1) * 0.5;\
        this.speedY = 1;\
        this.shootTimer = Phaser.Math.Between(120, 300);\
        this.text = scene.add.text(x + 15, 65, number, fontStyle);\
        scene.physics.add.existing(this);\
    \}\
\
    update() \{\
        this.x += this.speedX;\
        this.y += this.speedY;\
        if (this.x < 25) \{ this.x = 25; this.speedX = -this.speedX; \}\
        if (this.x > 775) \{ this.x = 775; this.speedX = -this.speedX; \}\
        this.text.setPosition(this.x - 10, this.y + 15);\
\
        this.shootTimer--;\
        if (this.shootTimer <= 0 && enemyBullets.getLength() < 20) \{\
            enemyBullets.create(this.x, this.y + 50, 'bullet').setSize(5, 10).setVelocityY(180);\
            this.shootTimer = Phaser.Math.Between(120, 300);\
        \}\
    \}\
\
    destroy() \{\
        this.text.destroy();\
        super.destroy();\
    \}\
\}\
\
// Collision check\
function checkCollision(obj1, obj2) \{\
    const bounds1 = obj1.getBounds();\
    const bounds2 = obj2.getBounds();\
    return Phaser.Geom.Intersects.RectangleToRectangle(bounds1, bounds2);\
\}\
\
// Spawn question and ships\
function spawnQuestion(scene) \{\
    question = generateQuestion();\
    questionText.setText(question.text);\
    answerShips.clear(true, true);\
    const answers = [question.answer];\
    let wrong1, wrong2;\
    do \{ wrong1 = question.answer + Phaser.Math.Between(-2, 2); \} while (wrong1 === question.answer || wrong1 < 0);\
    do \{ wrong2 = question.answer + Phaser.Math.Between(-2, 2); \} while (wrong2 === question.answer || wrong2 === wrong1 || wrong2 < 0);\
    answers.push(wrong1, wrong2);\
    Phaser.Utils.Array.Shuffle(answers);\
    answerShips.add(new AnswerShip(scene, 150, answers[0]));\
    answerShips.add(new AnswerShip(scene, 350, answers[1]));\
    answerShips.add(new AnswerShip(scene, 550, answers[2]));\
\}\
\
// Profile screen\
function profileScreen(scene) \{\
    const prompt = scene.add.text(250, 280, "Enter Your Name: ", fontStyle);\
    const instr = scene.add.text(340, 550, "Press Enter to Start", blueStyle);\
    let inputActive = true;\
\
    scene.input.keyboard.on('keydown', function (event) \{\
        if (!inputActive) return;\
        if (event.key === 'Enter' && playerName) \{\
            inputActive = false;\
            prompt.destroy();\
            instr.destroy();\
            startGame(scene);\
        \} else if (event.key === 'Backspace') \{\
            playerName = playerName.slice(0, -1);\
            prompt.setText("Enter Your Name: " + playerName);\
        \} else if (/^[a-zA-Z0-9]$/.test(event.key) && playerName.length < 10) \{\
            playerName += event.key;\
            prompt.setText("Enter Your Name: " + playerName);\
        \}\
    \});\
\}\
\
// Start game\
function startGame(scene) \{\
    player = scene.add.triangle(400, 540, 25, 0, 0, 50, 50, 50, 0xFFFF00);\
    scene.physics.add.existing(player);\
    bullets = scene.physics.add.group();\
    enemyBullets = scene.physics.add.group(\{ defaultKey: 'bullet', classType: Phaser.GameObjects.Rectangle, setFillStyle: \{ color: 0xFF0000 \} \});\
    answerShips = scene.add.group();\
\
    scene.input.keyboard.on('keydown-SPACE', () => \{\
        if (!gameOver && bullets.getLength() < 20) \{\
            const bullet = scene.physics.add.rectangle(player.x, player.y - 10, 5, 10, 0xFFFF00);\
            bullet.speed = -300;\
            bullet.setVelocityY(bullet.speed);\
            bullets.add(bullet);\
        \}\
    \});\
\
    scoreText = scene.add.text(10, 10, `Score: $\{score\} ($\{playerName\})`, fontStyle);\
    livesText = scene.add.text(10, 40, `Lives: $\{lives\}`, fontStyle);\
    questionText = scene.add.text(350, 10, "", fontStyle);\
    instrText = scene.add.text(250, 570, "Move with arrows, shoot with space!", blueStyle);\
    spawnQuestion(scene);\
\}\
\
// Update HUD\
function updateHUD() \{\
    scoreText.setText(`Score: $\{score\} ($\{playerName\})`);\
    livesText.setText(`Lives: $\{lives\}`);\
\}\
\
// Leaderboard (stored in localStorage for simplicity)\
function saveLeaderboard() \{\
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');\
    leaderboard.push(\{ name: playerName, score \});\
    leaderboard.sort((a, b) => b.score - a.score);\
    leaderboard = leaderboard.slice(0, 5);\
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));\
\}\
\
function showGameOver(scene) \{\
    gameOverText = scene.add.text(200, 300, `Game Over, $\{playerName\}! Score: $\{score\} - Press R to Restart`, fontStyle);\
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');\
    let y = 100;\
    scene.add.text(350, 50, "Leaderboard", fontStyle);\
    leaderboard.forEach((entry, i) => \{\
        scene.add.text(300, y + i * 40, `$\{i + 1\}. $\{entry.name\}: $\{entry.score\}`, fontStyle);\
    \});\
    scene.add.text(340, 550, "Press Enter to Continue", blueStyle);\
\
    scene.input.keyboard.once('keydown-R', () => \{\
        resetGame(scene);\
    \});\
    scene.input.keyboard.once('keydown-ENTER', () => \{\
        resetGame(scene);\
    \});\
\}\
\
function resetGame(scene) \{\
    gameOver = false;\
    score = 0;\
    lives = 3;\
    bullets.clear(true, true);\
    enemyBullets.clear(true, true);\
    answerShips.clear(true, true);\
    gameOverText.destroy();\
    spawnQuestion(scene);\
    updateHUD();\
\}\
}
