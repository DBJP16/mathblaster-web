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
let score = 0, lives = 3, gameOver = false, question = null;
const fontStyle = { font: "30px Arial", fill: "#FFFFFF" };
const blueStyle = { font: "30px Arial", fill: "#0000FF" };

function preload() {
    // No external assets needed for now—using shapes
}

function create() {
    // Profile entry
    profileScreen(this);
}

function update() {
    if (!playerName) return; // Wait for name entry

    if (!gameOver) {
        // Player movement
        const cursors = this.input.keyboard.createCursorKeys();
        if (cursors.left.isDown && player.x > 25) player.x -= 5;
        if (cursors.right.isDown && player.x < 775) player.x += 5;

        // Update answer ships
        answerShips.getChildren().forEach(ship => {
            ship.update();
            if (ship.y > 540) {
                lives--;
                spawnQuestion(this);
                updateHUD();
            }
        });

        // Update player bullets
        bullets.getChildren().forEach(bullet => {
            bullet.y += bullet.speed;
            if (bullet.y < 0) bullet.destroy();
            answerShips.getChildren().forEach(ship => {
                if (checkCollision(bullet, ship)) {
                    bullet.destroy();
                    ship.destroy();
                    if (ship.number === question.answer) score += 10;
                    else lives