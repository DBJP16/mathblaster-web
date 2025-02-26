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
let score = 0, lives = 3, gameOver = false, question = null, gameStarted = false, currentScene; // Add scene ref
const fontStyle = { font: "30px Arial", fill: "#FFFFFF" };
const blueStyle = { font: "30px Arial", fill: "#0000FF" };

function preload() {
    console.log("Preload running");
}

function create() {
    console.log("Create running");
    currentScene = this; // Store scene reference
    bullets = this.physics.add.group();
    enemyBullets = this.physics.add.group({ defaultKey: 'bullet', classType: Phaser.GameObjects.Rectangle, setFillStyle: { color: 0xFF0000 } });
    answerShips = this.add.group();

    // Global key listener with scene context
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
        
        // Player movement
        console.log("Checking cursors");
        const cursors = this.input.keyboard.createCursorKeys();
        if (cursors.left.isDown && player.x > 25) player.x -= 5;
        if (cursors.right.isDown && player.x < 775) player.x += 5;

        // Answer ships
        console.log("Updating ships");
        let shipsToRemove = [];
        answerShips.getChildren().forEach(ship => {
            ship.update();
            if (ship.y > 540) {
                lives--;
                shipsToRemove.push(ship);
            }
        });

        // Player bullets
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

        // Enemy bullets
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

        // Spawn new question if needed
        if (shipsToRemove.length > 0) {
            console.log("Spawning new question due to:", shipsToRemove.length, "ships removed");
            spawnQuestion(this);
        }

        // Clean up
        console.log("Cleaning up:", bulletsToRemove.length, enemyBulletsToRemove.length, shipsToRemove.length);
        bulletsToRemove.forEach(bullet => bullet.destroy());
        enemyBulletsToRemove.forEach(bullet => bullet.destroy());
        shipsToRemove.forEach(ship => ship.destroy());

        console.log("Updating HUD");
        updateHUD();

        if (lives <= 0) {
            console.log("Game over triggered");
            gameOver = true;
            saveLeaderboard