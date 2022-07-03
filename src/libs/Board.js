export class Board {
  constructor(id, color = '#000', fontsize = 1) {
    this.canvas = document.getElementById(id);
    this.context = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.posX = 0;
    this.posY = 0;
    this.penColor = color;
    this.fontsize = fontsize;
    this.isErasing = false;
    this.step = 0;
    this.histroyList = [];
    this.init();
  }
  init() {
    const bindDown = this.handleMouseDown.bind(this);
    const bindMove = this.handleMouseMove.bind(this);

    this.canvas.addEventListener('mousedown', bindDown);
    this.canvas.addEventListener('mousemove', bindMove);

    window.addEventListener('mouseup', () => {
      this.isDrawing = false;
    });

        this.canvas.addEventListener('mouseup', () => {
          this.step++;
          if (this.step < this.histroyList.length) {
            this.histroyList.length = this.step;
          }
          this.histroyList.push(this.canvas.toDataURL());
        });

        this.histroyList.push(this.canvas.toDataURL());
      }
      handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.posX = e.clientX - rect.left;
        this.posY = e.clientY - rect.top;
console.log('点击:', {x1: this.posX, y1: this.posY});
        this.isDrawing = true;
      }

      handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();

        if (this.isErasing) {
          this.context.globalCompositeOperation = 'destination-out';
          this.context.beginPath();
          this.context.arc(e.clientX - rect.left, e.clientY - rect.top,
 10, 0, Math.PI * 2);
          this.context.fill();
        } else if (this.isDrawing === true) {
          this.drawLine(this.context, this.posX, this.posY, e.clientX - rect.left, e.clientY - rect.top);
          this.posX = e.clientX - rect.left;
          this.posY = e.clientY - rect.top;
console.log('移动:', { x2: this.posX, y2: this.posY });
        }
      }

      drawLine(context, x1, y1, x2, y2) {
console.log('画:', {x1, y1, x2, y2});
        context.beginPath();
        context.strokeStyle = this.penColor;
        context.lineWidth = this.fontsize;
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
        context.closePath();
      }

      changeColor(color) {
        this.penColor = color;
      }
      changeFontSize(size) {
        this.fontsize = size;
      }
      switchEraseStatus() {
        this.isErasing = !this.isErasing;
      }
      clearBoard() {
        this.context.clearRect(0, 0, window.myCanvas.width,
 window.myCanvas.height);
        this.step = 0;
        this.histroyList = [];
      }
      revoke() {
        if (this.step > 0) {
          this.step--;
          this.context.clearRect(0, 0, window.myCanvas.width, 
window.myCanvas.height);
          let pic = new Image();
          pic.src = this.histroyList[this.step];
          pic.addEventListener('load', () => {
            this.context.drawImage(pic, 0, 0);
          })
        } else {
          console.log('不能继续撤销了')
        }
      }
      recover() {
        if (this.step < this.histroyList.length - 1) {
          this.step++;
          this.context.clearRect(0, 0, window.myCanvas.width,
 window.myCanvas.height);
          let pic = new Image();
          pic.src = this.histroyList[this.step];
          pic.addEventListener('load', () => {
            this.context.drawImage(pic, 0, 0);
          })
        } else {
          console.log('不能继续恢复了')
        }
      }
      saveAsPic() {
        const el = document.createElement('a');
        el.href = this.canvas.toDataURL();
        el.download = 'canvas';
        const event = new MouseEvent('click');
        el.dispatchEvent(event);
      }
}

export default Board;