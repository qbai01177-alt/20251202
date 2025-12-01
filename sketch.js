let spriteSheet;
let walkSheet;
let stopSheet;
let pushSheet;
let toolSheet;
let jumpFrames = [];
let walkFrames = [];
let stopFrames = [];
let pushFrames = [];
let toolFrames = [];
let currentFrame = 0;

// 跳躍動畫參數
const jumpNumFrames = 10;
const jumpFrameWidth = 1365 / jumpNumFrames;
const jumpFrameHeight = 188;

// 行走動畫參數
const walkNumFrames = 9;
const walkFrameWidth = 1246 / walkNumFrames;
const walkFrameHeight = 198;

// 待機動畫參數
const stopNumFrames = 11;
const stopFrameWidth = 1524 / stopNumFrames;
const stopFrameHeight = 212;

// 攻擊動畫參數
const pushNumFrames = 4;
const pushFrameWidth = 1039 / pushNumFrames;
const pushFrameHeight = 146;

// 飛行道具動畫參數 (假設為4幀)
const toolNumFrames = 4;
const toolFrameWidth = 740 / toolNumFrames;
const toolFrameHeight = 19;

// 角色狀態與物理變數
let playerX, playerY;
let velocityY = 0;
const gravity = 0.6; // 重力強度
const jumpStrength = -15; // 向上跳躍的力道 (負值代表向上)
const walkSpeed = 5; // 走路速度
let isJumping = false; // 追蹤角色是否在空中
let isWalking = false; // 追蹤角色是否在走路
let isAttacking = false; // 追蹤角色是否在攻擊
let isFacingRight = true; // 追蹤角色面向方向
let groundY;
let attackTimer = 0; // 攻擊動畫計時器
let hasSpawnedProjectile = false; // 追蹤本次攻擊是否已發射飛行道具

// 飛行道具管理
let projectiles = [];

function preload() {
  // 從 '1' 資料夾載入圖片精靈
  spriteSheet = loadImage('1/jump.png');
  walkSheet = loadImage('1/walk.png');
  stopSheet = loadImage('1/stop.png');
  pushSheet = loadImage('1/push.png');
  toolSheet = loadImage('1/tool.png');
}

function setup() {
  // 建立一個全視窗的畫布
  createCanvas(windowWidth, windowHeight);

  // 初始化角色位置
  // 注意：我們以最高的待機圖檔為基準來計算地面，以避免動畫切換時的抖動
  groundY = (height - stopFrameHeight) / 2;
  playerX = (width - stopFrameWidth) / 2;
  playerY = groundY;

  // 將 spriteSheet 切割成 10 個影格
  for (let i = 0; i < jumpNumFrames; i++) {
    let frame = spriteSheet.get(i * jumpFrameWidth, 0, jumpFrameWidth, jumpFrameHeight);
    jumpFrames.push(frame); // 將切割後的影格存入 jumpFrames 陣列
  }

  // 將 walkSheet 切割成 9 個影格
  for (let i = 0; i < walkNumFrames; i++) {
    let frame = walkSheet.get(i * walkFrameWidth, 0, walkFrameWidth, walkFrameHeight);
    walkFrames.push(frame);
  }

  // 將 stopSheet 切割成 11 個影格
  for (let i = 0; i < stopNumFrames; i++) {
    let frame = stopSheet.get(i * stopFrameWidth, 0, stopFrameWidth, stopFrameHeight);
    stopFrames.push(frame);
  }

  // 將 pushSheet 切割成 4 個影格
  for (let i = 0; i < pushNumFrames; i++) {
    let frame = pushSheet.get(i * pushFrameWidth, 0, pushFrameWidth, pushFrameHeight);
    pushFrames.push(frame);
  }

  // 將 toolSheet 切割成 4 個影格
  for (let i = 0; i < toolNumFrames; i++) {
    let frame = toolSheet.get(i * toolFrameWidth, 0, toolFrameWidth, toolFrameHeight);
    toolFrames.push(frame);
  }
}

function draw() {
  // 設定背景顏色
  background('#ade8f4');
  
  // --- 輸入處理 ---
  // 使用 keyIsDown 實現持續移動
  if (!isAttacking && !isJumping) {
    if (keyIsDown(68)) { // 'D' 鍵
      playerX += walkSpeed;
      isWalking = true;
      isFacingRight = true;
    } else if (keyIsDown(65)) { // 'A' 鍵
      playerX -= walkSpeed;
      isWalking = true;
      isFacingRight = false;
    } else {
      isWalking = false;
    }
  }

  // --- 物理更新 ---
  velocityY += gravity; // 將重力應用到垂直速度
  playerY += velocityY; // 根據速度更新 Y 位置
  
  // 檢查角色是否落地
  if (playerY >= groundY) {
    playerY = groundY; // 將角色固定在地面上，避免掉下去
    velocityY = 0; // 停止垂直移動
    isJumping = false; // 設定為不在跳躍狀態
  }
  
  // --- 動畫更新與繪製 ---
  let displayFrame;
  let frameW, frameH;

  if (isAttacking) {
    // 狀態1: 攻擊 (最高優先級)
    // 根據計時器決定顯示哪一幀，讓動畫播放一次後停止
    let attackFrameIndex = floor(attackTimer / 5); // 每5幀換一圖
    if (attackFrameIndex >= pushNumFrames) {
      isAttacking = false; // 動畫結束
    } else {
      displayFrame = pushFrames[attackFrameIndex];
      frameW = pushFrameWidth;
      frameH = pushFrameHeight;
      attackTimer++;

      // 在攻擊動畫的特定幀發射飛行道具
      // 這裡假設在第 3 幀 (索引為 2) 發射，您可以根據實際動畫效果調整這個數字
      if (attackFrameIndex === 2 && !hasSpawnedProjectile) {
        let projectile = {
          x: isFacingRight ? playerX + frameW - 20 : playerX - toolFrameWidth + 20, // 調整發射位置
          y: playerY + frameH / 2 - toolFrameHeight / 2, // 調整發射高度，使其與角色中心對齊
          speed: isFacingRight ? 10 : -10,
          animFrame: 0
        };
        projectiles.push(projectile);
        hasSpawnedProjectile = true; // 標記為已發射，本次攻擊不再發射
      }
    }
  }
  
  if (!isAttacking && isJumping) {
    // 狀態2: 跳躍
    if (frameCount % 5 === 0) {
      currentFrame = (currentFrame + 1) % jumpNumFrames;
    }
    displayFrame = jumpFrames[currentFrame];
    frameW = jumpFrameWidth;
    frameH = jumpFrameHeight;
  } else if (!isAttacking && isWalking) {
    // 狀態3: 行走
    if (frameCount % 5 === 0) {
      currentFrame = (currentFrame + 1) % walkNumFrames;
    }
    displayFrame = walkFrames[currentFrame];
    frameW = walkFrameWidth;
    frameH = walkFrameHeight;
  } else if (!isAttacking) {
    // 狀態4: 站立/待機 (預設)
    // 播放待機動畫
    if (frameCount % 8 === 0) { // 待機動畫可以慢一點
      currentFrame = (currentFrame + 1) % stopNumFrames;
    }
    displayFrame = stopFrames[currentFrame];
    frameW = stopFrameWidth;
    frameH = stopFrameHeight;
  }
  
  // --- 更新與繪製飛行道具 ---
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    p.x += p.speed; // 移動
    p.animFrame = (p.animFrame + 0.2) % toolNumFrames; // 動畫
    
    image(toolFrames[floor(p.animFrame)], p.x, p.y); // 繪製
    
    // 如果飛出畫面，則移除
    if (p.x > width || p.x < -toolFrameWidth) {
      projectiles.splice(i, 1);
    }
  }

  // --- 繪製角色 ---
  push(); // 保存當前的繪圖狀態
  translate(playerX + frameW / 2, playerY + frameH / 2); // 將座標原點移到圖片中心
  if (!isFacingRight) {
    scale(-1, 1); // 如果角色向左，則水平翻轉
  }
  image(displayFrame, -frameW / 2, -frameH / 2); // 在新的原點繪製圖片
  pop(); // 恢復繪圖狀態
}

// 處理鍵盤按下事件
function keyPressed() {
  // 當按下 'W' 鍵且角色不在空中或攻擊時，觸發跳躍
  if ((key === 'W' || key === 'w') && !isJumping && !isAttacking) {
    velocityY = jumpStrength; // 給予向上的初速度
    isJumping = true; // 設定為跳躍狀態
    currentFrame = 0; // 重置動畫影格，讓跳躍從第一格開始
  }

  // 當按下空白鍵且角色不在攻擊時，觸發攻擊 (現在允許在跳躍時攻擊)
  if (keyCode === 32 && !isAttacking) {
    isAttacking = true;
    attackTimer = 0; // 重置攻擊計時器
    isWalking = false; // 攻擊時停止走路
    // 注意：飛行道具的生成邏輯已移至 draw() 函式中，以確保發射時機準確
    // 這裡只負責啟動攻擊狀態並重置旗標
    hasSpawnedProjectile = false; // 重置發射標記，準備本次攻擊發射飛行道具
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 當視窗大小改變時，重新計算角色位置
  groundY = (height - stopFrameHeight) / 2; // 同樣更新地面位置到垂直中央
  
  // 如果角色沒有在移動，將其重新置中
  // 這裡我們假設遊戲開始時角色是靜止的
  if (!isJumping) {
    playerX = (width - stopFrameWidth) / 2;
    playerY = groundY;
  }
}
