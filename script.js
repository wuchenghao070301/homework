// ===================== 游戏核心类 =====================
class HanoiGame {
    constructor() {
        // 游戏状态（标准对象+数组结构）
        this.gameState = {
            disksCount: 5,
            pegs: [[], [], []], // 三个柱子，栈结构
            moves: 0,
            isAutoSolving: false,
            isWin: false,
            selectedPeg: null // 选中的柱子索引
        };

        // DOM 元素
        this.elements = {
            pegs: document.querySelectorAll('.peg'),
            moveCount: document.getElementById('moveCount'),
            diskSlider: document.getElementById('diskSlider'),
            diskInput: document.getElementById('diskInput'),
            resetBtn: document.getElementById('resetBtn'),
            autoSolveBtn: document.getElementById('autoSolveBtn'),
            messageBox: document.getElementById('messageBox'),
            gameBoard: document.getElementById('gameBoard')
        };

        // 绑定事件
        this.bindEvents();
        // 初始化游戏
        this.initGame();
    }

    // ===================== 初始化 =====================
    initGame() {
        const { disksCount } = this.gameState;
        // 重置数组：生成初始栈（大数字在底部）
        this.gameState.pegs = [[], [], []];
        for (let i = disksCount; i >= 1; i--) {
            this.gameState.pegs[0].push(i);
        }
        this.gameState.moves = 0;
        this.gameState.selectedPeg = null;
        this.gameState.isWin = false;
        this.gameState.isAutoSolving = false;

        // 渲染界面
        this.render();
        this.updateMoveCount();
        this.hideMessage();
    }

    // ===================== 渲染界面 =====================
    render() {
        // 清空所有柱子
        this.elements.pegs.forEach(peg => peg.innerHTML = '');

        // 遍历数组渲染每个柱子的圆盘
        this.gameState.pegs.forEach((pegDisks, pegIndex) => {
            const pegEl = this.elements.pegs[pegIndex];
            
            // 遍历栈，从下到上排列
            pegDisks.forEach((diskSize, idx) => {
                const disk = document.createElement('div');
                disk.className = `disk disk-${diskSize}`;
                // 垂直定位
                const bottom = idx * 32 + 10;
                disk.style.bottom = `${bottom}px`;

                // 绑定点击事件：仅选中顶部圆盘
                if (idx === pegDisks.length - 1 && !this.gameState.isAutoSolving && !this.gameState.isWin) {
                    disk.onclick = () => this.selectDisk(pegIndex);
                }

                pegEl.appendChild(disk);
            });
        });
    }

    // ===================== 选择圆盘 =====================
    selectDisk(pegIndex) {
        const { pegs, selectedPeg } = this.gameState;

        // 未选中 → 选中当前柱子顶部
        if (selectedPeg === null) {
            this.gameState.selectedPeg = pegIndex;
            this.render();
            // 高亮选中
            const topDisk = this.elements.pegs[pegIndex].lastChild;
            if (topDisk) topDisk.classList.add('selected');
            return;
        }

        // 已选中 → 尝试移动
        this.moveDisk(selectedPeg, pegIndex);
    }

    // ===================== 移动验证（核心规则） =====================
    isValidMove(fromPeg, toPeg) {
        const fromStack = this.gameState.pegs[fromPeg];
        const toStack = this.gameState.pegs[toPeg];

        // 空栈不能移动
        if (fromStack.length === 0) return false;
        // 目标空 → 合法
        if (toStack.length === 0) return true;
        // 顶部圆盘必须更小
        return fromStack.at(-1) < toStack.at(-1);
    }

    // ===================== 执行移动 =====================
    moveDisk(fromPeg, toPeg) {
        // 不允许自动求解/胜利时操作
        if (this.gameState.isAutoSolving || this.gameState.isWin) return;

        if (!this.isValidMove(fromPeg, toPeg)) {
            this.showMessage('❌ 不能把大圆盘放在小圆盘上！', 'warning');
            this.gameState.selectedPeg = null;
            this.render();
            return;
        }

        // 数组操作：pop 取出、push 放入（栈结构）
        const disk = this.gameState.pegs[fromPeg].pop();
        this.gameState.pegs[toPeg].push(disk);

        // 更新步数
        this.gameState.moves++;
        this.updateMoveCount();

        // 重置选中状态
        this.gameState.selectedPeg = null;
        this.render();

        // 检查胜利
        if (this.checkWin()) {
            this.gameState.isWin = true;
            this.showMessage('🎉 恭喜通关！你太棒了！', 'success');
        }
    }

    // ===================== 胜利判断 =====================
    checkWin() {
        const { disksCount, pegs } = this.gameState;
        return pegs[2].length === disksCount;
    }

    // ===================== 自动求解（递归算法） =====================
    async autoSolve() {
        if (this.gameState.isAutoSolving || this.gameState.isWin) return;
        
        this.gameState.isAutoSolving = true;
        this.toggleButtons(true);
        this.showMessage('⏳ 自动求解中...', 'warning');

        // 生成移动步骤
        const steps = [];
        this.hanoiRecursive(this.gameState.disksCount, 0, 2, 1, steps);

        // 延迟执行每一步
        for (const [from, to] of steps) {
            await this.delay(800);
            this.moveDisk(from, to);
        }

        this.gameState.isAutoSolving = false;
        this.toggleButtons(false);
    }

    // 汉诺塔递归算法
    hanoiRecursive(n, from, to, aux, steps) {
        if (n === 1) {
            steps.push([from, to]);
            return;
        }
        this.hanoiRecursive(n - 1, from, aux, to, steps);
        steps.push([from, to]);
        this.hanoiRecursive(n - 1, aux, to, from, steps);
    }

    // ===================== 工具方法 =====================
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateMoveCount() {
        this.elements.moveCount.textContent = this.gameState.moves;
    }

    showMessage(text, type) {
        this.elements.messageBox.textContent = text;
        this.elements.messageBox.className = `message-box show ${type}`;
    }

    hideMessage() {
        this.elements.messageBox.classList.remove('show');
    }

    toggleButtons(disabled) {
        this.elements.resetBtn.disabled = disabled;
        this.elements.autoSolveBtn.disabled = disabled;
        this.elements.diskSlider.disabled = disabled;
        this.elements.diskInput.disabled = disabled;
    }

    // ===================== 事件绑定 =====================
    bindEvents() {
        // 滑块与数字输入同步
        this.elements.diskSlider.addEventListener('input', e => {
            this.gameState.disksCount = +e.target.value;
            this.elements.diskInput.value = e.target.value;
            this.initGame();
        });

        this.elements.diskInput.addEventListener('input', e => {
            let val = +e.target.value;
            val = Math.max(3, Math.min(8, val));
            this.gameState.disksCount = val;
            this.elements.diskSlider.value = val;
            this.elements.diskInput.value = val;
            this.initGame();
        });

        // 重置按钮
        this.elements.resetBtn.addEventListener('click', () => {
            this.initGame();
        });

        // 自动求解
        this.elements.autoSolveBtn.addEventListener('click', () => {
            this.autoSolve();
        });
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    new HanoiGame();
});
