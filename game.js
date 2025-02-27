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

let player, bullets, enemyBullets, answerShips, questionText, scoreText, livesText, instrText, gameOverText, playerName = "";
let score = 0, lives = 3, gameOver = false, question = null, gameStarted = false, currentScene;
const fontStyle = { font: "30px Arial", fill: "#FFFFFF" };
const blueStyle = { font: "30px Arial", fill: "#0000FF" };

function preload() {
    console.log("Preload running");
}

function create() {
    console.log("Create running");
    currentScene = this;
    bullets = this.physics.add.group();
    enemyBullets = this.physics.add.group();
    answerShips = this.add.group();

    document.addEventListener('keydown', (event) => {
        console.log("Keydown detected:", event.key, "Code:", event.code);
        if (event.code === 'Space' && gameStarted && !gameOver && bullets.getLength() < 20) {
            console.log("Space shooting!");
            const bullet = currentScene.physics.add.rectangle(player.x, player.y - 10, 5, 10, 0xFFFF00);
            bullet.speed = -300;
            bullet.setVelocityY(bullet.speed);
            bullets.add(bullet);
        }
    });

    profileScreen(this);
}

function update() {
    if (!playerName || !gameStarted) return;

    if (!gameOver) {
        console.log("Update start: Lives", lives, "Bullets", bullets.getLength(), "Ships", answerShips.getLength());
        
        console.log("Checking cursors");
        const cursors = this.input.keyboard.createCursorKeys();
        if (cursors.left.isDown && player.x > 25) player.x -= 5;
        if (cursors.right.isDown && player.x < 775) player.x += 5;

        console.log("Updating ships");
        let shipsToRemove = [];
        answerShips.getChildren().forEach(ship => {
            ship.update();
            if (ship.y > 540) {
                lives--;
                shipsToRemove.push(ship);
            }
        });

        console.log("Updating player bullets");
        let bulletsToRemove = [];
        bullets.getChildren().forEach(bullet => {
            bullet.y += bullet.speed;
            if (bullet.y < 0) bulletsToRemove.push(bullet);
            answerShips.getChildren().forEach(ship => {
                if (checkCollision(bullet, ship)) {
                    bulletsToRemove.push(bullet);
                    shipsToRemove.push(ship);
                    if (ship.number === question.answer) score += 10;
                    else lives--;
                }
            });
        });

        console.log("Updating enemy bullets");
        let enemyBulletsToRemove = [];
        enemyBullets.getChildren().forEach(bullet => {
            bullet.y += bullet.speed;
            if (bullet.y > 600) enemyBulletsToRemove.push(bullet);
            else if (checkCollision(bullet, player)) {
                enemyBulletsToRemove.push(bullet);
                lives--;
            }
        });

        if (shipsToRemove.length > 0) {
            console.log("Spawning new question due to:", shipsToRemove.length, "ships removed");
            spawnQuestion(this);
        }

        console.log("Cleaning up:", bulletsToRemove.length, enemyBulletsToRemove.length, shipsToRemove.length);
        bulletsToRemove.forEach(bullet => bullet.destroy());
        enemyBulletsToRemove.forEach(bullet => bullet.destroy());
        shipsToRemove.forEach(ship => ship.destroy());

        console.log("Updating HUD");
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
        super(scene, x, 50, 25, 0, 0, 50, 50, 50, 0xFF0000);
        scene.add.existing(this);
        this.number = number;
        this.speedX = (Math.random() < 0.5 ? -1 : 1) * 0.5;
        this.speedY = 1;
        this.shootTimer = Phaser.Math.Between(120, 300);
        this.text = scene.add.text(x + 15, 65, number, fontStyle);
        scene.physics.add.existing(this);
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 25) { this.x = 25; this.speedX = -this.speedX; }
        if (this.x > 775) { this.x = 775; this.speedX = -this.speedX; }
        this.text.setPosition(this.x - 10, this.y + 15);

        this.shootTimer--;
        if (this.shootTimer <= 0 && enemyBullets.getLength() < 20) {
            const bullet = currentScene.physics.add.rectangle(this.x, this.y + 50, 5, 10, 0xFF0000);
            bullet.setSize(5, 10);
            bullet.setVelocityY(180);
            enemyBullets.add(bullet);
            this.shootTimer = Phaser.Math.Between(120, 300);
        }
    }

    destroy() {
        this.text.destroy();
        super.destroy();
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
}

// Profile screen
function profileScreen(scene) {
    const prompt = scene.add.text(250, 280, "Enter Your Name: ", fontStyle);
    const instr = scene.add.text(340, 550, "Press Enter to Start", blueStyle);
    const focusText = scene.add.text(300, 50, "Click here to start typing", blueStyle);
    let inputActive = false;

    scene.input.once('pointerdown', () => {
        inputActive = true;
        focusText.destroy();
        console.log("Canvas focused—start typing!");
    });

    function handleKeyDown(event) {
        console.log("Key pressed:", event.key);
        if (!inputActive) return;
        if (event.key === 'Enter' && playerName) {
            inputActive = false;
            prompt...

Something went wrong, please try again.