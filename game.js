const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    }
};

const game = new Phaser.Game(config);

let player, bullets, answerShips, questionText, scoreText, livesText, instrText, gameOverText, playerName = "";
let score = 0, lives = 3, gameOver = false, question = null, gameStarted = false;
const fontStyle = { font: "30px Arial", fill: "#FFFFFF" };
const blueStyle = { font: "30px Arial", fill: "#0000FF" };

function preload() {
    console.log("Preload running");
}

function create() {
    console.log("Create running");
    bullets = this.physics.add.group({
        maxSize: 20
    });
    answerShips = this.physics.add.group();

    this.input.keyboard.on('keydown-SPACE', () => {
        console.log("Space pressed!");
        if (gameStarted && !gameOver && bullets.getLength() < 20) {
            console.log("Shooting!");
            const bullet = bullets.create(player.x, player.y - 10);
            if (bullet) {
                bullet.setSize(5, 10);
                bullet.setVelocityY(-300);
                bullet.setFillStyle(0xFFFF00);
                console.log("Player bullet created at", player.x, player.y - 10);
            } else {
                console.log("Bullet pool full!");
            }
        }
    });

    profileScreen(this);
}

function update() {
    if (!playerName || !gameStarted) return;

    if (!gameOver) {
        console.log("Update start: Lives", lives, "Score", score, "Bullets", bullets.getLength(), "Ships", answerShips.getLength());
        
        console.log("Checking cursors...");
        const cursors = this.input.keyboard.createCursorKeys();
        if (cursors.left.isDown && player.x > 25) player.x -= 5;
        if (cursors.right.isDown && player.x < 775) player.x += 5;

        console.log("Updating ships...");
        let shipsToRemove = [];
        answerShips.getChildren().forEach(ship => {
            ship.y += ship.speedY;
            ship.text.setPosition(ship.x - 10, ship.y + 15);
            console.log("Ship update: x=", ship.x, "y=", ship.y);
            if (ship.y > 540) {
                lives--;
                shipsToRemove.push(ship);
                console.log("Ship reached bottom, lives:", lives);
            }
        });

        console.log("Updating bullets...");
        let bulletsToRemove = [];
        bullets.getChildren().forEach(bullet => {
            console.log("Player bullet y:", bullet.y);
            if (bullet.y < 0) bulletsToRemove.push(bullet);
            answerShips.getChildren().forEach(ship => {
                if (checkCollision(bullet, ship)) {
                    bulletsToRemove.push(bullet);
                    shipsToRemove.push(ship);
                    if (ship.number === question.answer) {
                        score += 1;
                        console.log("Correct answer hit! Score:", score);
                    } else {
                        lives--;
                        console.log("Wrong answer hit! Lives:", lives);
                    }
                }
            });
        });

        if (shipsToRemove.length > 0) {
            console.log("Spawning new question due to:", shipsToRemove.length, "ships removed");
            spawnQuestion(this);
        }

        console.log("Cleaning up:", bulletsToRemove.length, shipsToRemove.length);
        bulletsToRemove.forEach(bullet => bullet.destroy());
        shipsToRemove.forEach(ship => ship.destroy());

        console.log("Updating HUD...");
        updateHUD();

        if (lives <= 0) {
            console.log("Game over triggered");
            gameOver = true;
            saveLeaderboard();
            showGameOver(this);
        }
        console.log("Update end");
    }
}

// Question generator
function generateQuestion() {
    console.log("Generating question...");
    const a = Math.floor(Math.random() * 10) + 1;
    const op = Math.random() < 0.5 ? "+" : "-";
    let b, answer;
    if (op === "+") {
        b = Math.floor(Math.random() * (10 - a)) + 1;
        answer = a + b;
    } else {
        b = Math.floor(Math.random() * a) + 1;
        answer = a - b;
    }
    return { a, b, op, answer, text: `${a} ${op} ${b} = ?` };
}

// Answer ship
class AnswerShip extends Phaser.GameObjects.Triangle {
    constructor(scene, x, number) {
        super(scene, x, 50,       // Top (nose)
              x - 25, 75,     // Left base (wing)
              x + 25, 75,     // Right base (wing)
              0xFF0000);      // Red
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.number = number;
        this.speedY = 1;
        this.text = scene.add.text(x - 10, 80, number.toString(), fontStyle);
        console.log("Ship created at x=", x, "number=", number);
    }

    update() {
        // No enemy bullets—movement only
    }

    destroy() {
        this.text.destroy();
        super.destroy();
        console.log("Ship destroyed");
    }
}

// Collision check
function checkCollision(obj1, obj2) {
    const bounds1 = obj1.getBounds();
    const bounds2 = obj2.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(bounds1, bounds2);
}

// Spawn question and ships
function spawnQuestion(scene) {
    console.log("Spawning question");
    question = generateQuestion();
    questionText.setText(question.text);
    answerShips.clear(true, true);
    const answers = [question.answer];
    let wrong1, wrong2;
    do { wrong1 = question.answer + Phaser.Math.Between(-2, 2); } while (wrong1 === question.answer || wrong1 < 0);
    do { wrong2 = question.answer + Phaser.Math.Between(-2, 2); } while (wrong2 === question.answer || wrong2 === wrong1 || wrong2 < 0);
    answers.push(wrong1, wrong2);
    Phaser.Utils.Array.Shuffle(answers);
    answerShips.add(new AnswerShip(scene, 150, answers[0]));
    answerShips.add(new AnswerShip(scene, 350, answers[1]));
    answerShips.add(new AnswerShip(scene, 550, answers[2]));
    console.log("Ships spawned:", answers);
}

// Profile screen
function profileScreen(scene) {
    console.log("Profile screen starting...");
    const prompt = scene.add.text(250, 280, "Enter Your Name: ", fontStyle);
    const instr = scene.add.text(340, 550, "Press Enter to Start", blueStyle);
    const focusText = scene.add.text(300, 50, "Click here to start typing", blueStyle);
    let inputActive = false;

    scene.input.once('pointerdown', () => {
        inputActive = true;
        focusText.destroy();
        console.log("Canvas focused—start typing!");
    });

    scene.input.keyboard.on('keydown', (event) => {
        console.log("Key pressed:", event.key);
        if (!inputActive) {
            console.log("Input not active yet—click first!");
            return;
        }
        if (event.key === 'Enter' && playerName) {
            console.log("Enter pressed with name:", playerName);
            inputActive = false;
            prompt.destroy();
            instr.destroy();
            scene.input.keyboard.off('keydown');
            startGame(scene);
        } else if (event.key === 'Backspace') {
            playerName = playerName.slice(0, -1);
            prompt.setText("Enter Your Name: " + playerName);
            console.log("Backspace—name now:", playerName);
        } else if (/^[a-zA-Z0-9]$/.test(event.key) && playerName.length < 10) {
            playerName += event.key;
            prompt.setText("Enter Your Name: " + playerName);
            console.log("Key added—name now:", playerName);
        }
    });
}

// Start game
function startGame(scene) {
    console.log("Starting game");
    player = scene.add.rectangle(400, 540, 50, 50, 0xFFFF00);
    scene.physics.add.existing(player);
    bullets = scene.physics.add.group();
    answerShips = scene.physics.add.group();

    scoreText = scene.add.text(10, 10, `Score: ${score} (${playerName})`, fontStyle);
    livesText = scene.add.text(10, 40, `Lives: ${lives}`, fontStyle);
    questionText = scene.add.text(350, 10, "", fontStyle);
    instrText = scene.add.text(250, 570, "Move with arrows, shoot with space!", blueStyle);
    spawnQuestion(scene);
    gameStarted = true;
    console.log("Game started!");
}

// Update HUD
function updateHUD() {
    scoreText.setText(`Score: ${score} (${playerName})`);
    livesText.setText(`Lives: ${lives}`);
}

// Leaderboard (stored in localStorage for simplicity)
function saveLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    leaderboard.push({ name: playerName, score });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

function showGameOver(scene) {
    gameOverText = scene.add.text(200, 300, `Game Over, ${playerName}! Score: ${score} - Press R to Restart`, fontStyle);
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    let y = 100;
    scene.add.text(350, 50, "Leaderboard", fontStyle);
    leaderboard.forEach((entry, i) => {
        scene.add.text(300, y + i * 40, `${i + 1}. ${entry.name}: ${entry.score}`, fontStyle);
    });
    scene.add.text(340, 550, "Press Enter to Continue", blueStyle);

    scene.input.keyboard.once('keydown-R', () => {
        resetGame(scene);
    });
    scene.input.keyboard.once('keydown-ENTER', () => {
        resetGame(scene);
    });
}

function resetGame(scene) {
    gameOver = false;
    score = 0;
    lives = 3;
    bullets.clear(true, true);
    answerShips.clear(true, true);
    gameOverText.destroy();
    spawnQuestion(scene);
    updateHUD();
}