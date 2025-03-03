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

let player, bullets, answerShips, questionText, scoreText, livesText, instrText, gameOverText, leaderboardTexts = [];
let score = 0, lives = 3, gameOver = false, question = null, gameStarted = false, playerName = null; // Initialize as null

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
            const bullet = this.physics.add.sprite(player.x, player.y - 10, null);
            bullet.setSize(5, 10);
            bullet.setVelocityY(-300);
            bullet.setTint(0xFFFF00);
            bullets.add(bullet);
            console.log("Player bullet created at", player.x, player.y - 10, "velocityY:", bullet.body.velocity.y);
        }
    });

    profileScreen(this);
}

function update() {
    if (playerName === null || !gameStarted) return; // Check null instead of undefined

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
        for (const bullet of bullets.getChildren()) {
            console.log("Player bullet y:", bullet.y);
            if (bullet.y < 0) {
                bulletsToRemove.push(bullet);
                continue;
            }
            let hit = false;
            for (const ship of answerShips.getChildren()) {
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
                    hit = true;
                    break;
                }
            }
            if (hit) break;
        }

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
            console.log("Game over triggered due to lives <= 0");
            gameOver = true;
            saveLeaderboard();
            showGameOver(this);
        } else {
            console.log("Lives still above 0—no game over yet");
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
        super(scene, x, 50,       // Top (